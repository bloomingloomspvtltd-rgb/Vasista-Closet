from datetime import datetime
import hashlib
import hmac
import json
from hashlib import sha256

import logging
import requests
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from ..config import settings
from ..db import get_db
from ..utils import serialize_doc, to_object_id
from ..services.order_email_service import send_admin_order_email, send_order_email

router = APIRouter(prefix="/payments", tags=["payments"])
logger = logging.getLogger("visista.payments")


class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int


class RazorpayOrderCreate(BaseModel):
    customer_id: str | None = None
    items: list[OrderItem]
    subtotal: float
    discount_id: str | None = None
    discount_amount: float = 0
    total: float
    currency: str = "INR"
    notes: dict | None = None


class RazorpayVerifyPayload(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class RazorpayRefundPayload(BaseModel):
    order_id: str
    amount: float | None = None  # in INR, optional for full refund


def _razorpay_auth():
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        logger.error("Razorpay not configured: missing key id or secret")
        raise HTTPException(status_code=500, detail="Razorpay is not configured")
    return (settings.razorpay_key_id, settings.razorpay_key_secret)


def _verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    payload = f"{order_id}|{payment_id}".encode()
    digest = hmac.new(
        settings.razorpay_key_secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(digest, signature)

def _verify_webhook_signature(raw_body: bytes, signature: str) -> bool:
    if not settings.razorpay_webhook_secret:
        raise HTTPException(status_code=500, detail="Razorpay webhook secret is not configured")
    digest = hmac.new(
        settings.razorpay_webhook_secret.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(digest, signature)

async def _record_webhook_event(db, event_id: str, event_name: str) -> bool:
    if not event_id:
        return True
    existing = await db.webhook_events.find_one({"event_id": event_id})
    if existing:
        return False
    await db.webhook_events.insert_one(
        {"event_id": event_id, "event": event_name, "received_at": datetime.utcnow()}
    )
    return True

@router.post("/razorpay/order")
async def create_razorpay_order(payload: RazorpayOrderCreate):
    db = get_db()

    if not payload.items:
        raise HTTPException(status_code=400, detail="Order items are required")
    if payload.total <= 0:
        raise HTTPException(status_code=400, detail="Total must be greater than zero")

    now = datetime.utcnow()
    order_doc = {
        "customer_id": payload.customer_id,
        "items": [item.model_dump() for item in payload.items],
        "status": "pending",
        "subtotal": payload.subtotal,
        "discount_id": payload.discount_id,
        "discount_amount": payload.discount_amount,
        "total": payload.total,
        "payment_provider": "razorpay",
        "payment_status": "created",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.orders.insert_one(order_doc)
    order_id = result.inserted_id

    amount_paise = int(round(payload.total * 100))
    data = {
        "amount": amount_paise,
        "currency": payload.currency,
        "receipt": str(order_id),
        "notes": payload.notes or {},
    }

    try:
        response = requests.post(
            "https://api.razorpay.com/v1/orders",
            auth=_razorpay_auth(),
            json=data,
            timeout=10,
        )
    except requests.RequestException as exc:
        logger.exception("Razorpay order create request failed")
        await db.orders.update_one(
            {"_id": order_id},
            {"$set": {"payment_status": "failed", "updated_at": datetime.utcnow()}},
        )
        raise HTTPException(status_code=502, detail="Failed to reach Razorpay") from exc

    if response.status_code >= 400:
        try:
            logger.error("Razorpay order create error %s %s", response.status_code, response.text)
        except Exception:
            logger.error("Razorpay order create error %s", response.status_code)
        await db.orders.update_one(
            {"_id": order_id},
            {"$set": {"payment_status": "failed", "updated_at": datetime.utcnow()}},
        )
        raise HTTPException(status_code=502, detail=response.text or "Failed to create Razorpay order")

    rp_order = response.json()
    await db.orders.update_one(
        {"_id": order_id},
        {
            "$set": {
                "razorpay_order_id": rp_order.get("id"),
                "razorpay_amount": rp_order.get("amount"),
                "razorpay_currency": rp_order.get("currency"),
                "updated_at": datetime.utcnow(),
            }
        },
    )

    created = await db.orders.find_one({"_id": order_id})
    if created:
        await send_admin_order_email(
            db,
            created,
            "New order received (payment pending) - Visista Closet",
        )

    return {
        "order_id": str(order_id),
        "razorpay_order_id": rp_order.get("id"),
        "amount": rp_order.get("amount"),
        "currency": rp_order.get("currency"),
        "key_id": settings.razorpay_key_id,
    }


@router.post("/razorpay/verify")
async def verify_razorpay_payment(payload: RazorpayVerifyPayload):
    db = get_db()
    try:
        oid = to_object_id(payload.order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order id")

    order = await db.orders.find_one({"_id": oid})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if not _verify_signature(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
    ):
        await db.orders.update_one(
            {"_id": oid},
            {"$set": {"payment_status": "failed", "updated_at": datetime.utcnow()}},
        )
        raise HTTPException(status_code=401, detail="Invalid payment signature")

    await db.orders.update_one(
        {"_id": oid},
        {
            "$set": {
                "payment_status": "paid",
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_signature": payload.razorpay_signature,
                "paid_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        },
    )
    updated = await db.orders.find_one({"_id": oid})
    await send_order_email(
        db,
        updated,
        "Payment received - Visista Closet",
        "Thank you for your order! Your payment has been received and your order is confirmed.",
        "We will ship your order soon and share tracking details.",
    )
    return serialize_doc(updated)


@router.post("/razorpay/refund")
async def create_razorpay_refund(payload: RazorpayRefundPayload):
    db = get_db()
    try:
        oid = to_object_id(payload.order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order id")

    order = await db.orders.find_one({"_id": oid})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    payment_id = order.get("razorpay_payment_id")
    if not payment_id:
        raise HTTPException(status_code=400, detail="Order has no payment to refund")

    data = {}
    if payload.amount is not None:
        if payload.amount <= 0:
            raise HTTPException(status_code=400, detail="Refund amount must be positive")
        data["amount"] = int(round(payload.amount * 100))

    try:
        response = requests.post(
            f"https://api.razorpay.com/v1/payments/{payment_id}/refund",
            auth=_razorpay_auth(),
            json=data if data else None,
            timeout=10,
        )
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail="Failed to reach Razorpay") from exc

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=response.text or "Failed to create refund")

    refund = response.json()
    refund_doc = {
        "id": refund.get("id"),
        "status": refund.get("status", "created"),
        "amount": refund.get("amount"),
        "created_at": refund.get("created_at") or datetime.utcnow(),
    }
    await db.orders.update_one(
        {"_id": oid},
        {
            "$set": {
                "refund_id": refund.get("id"),
                "refund_status": refund.get("status", "created"),
                "refund_amount": refund.get("amount"),
                "updated_at": datetime.utcnow(),
            },
            "$push": {"refunds": refund_doc},
        },
    )

    return {"status": "ok", "refund": refund}

@router.post("/razorpay/webhook")
async def razorpay_webhook(request: Request):
    signature = request.headers.get("X-Razorpay-Signature") or ""
    raw_body = await request.body()
    if not signature:
        raise HTTPException(status_code=400, detail="Missing webhook signature")
    if not _verify_webhook_signature(raw_body, signature):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body.decode())
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid webhook payload")

    event = payload.get("event")
    event_id = payload.get("id") or payload.get("event_id") or sha256(raw_body).hexdigest()
    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    refund_entity = payload.get("payload", {}).get("refund", {}).get("entity", {})
    razorpay_order_id = payment_entity.get("order_id")
    razorpay_payment_id = payment_entity.get("id")
    payment_status = payment_entity.get("status")

    if not razorpay_order_id and refund_entity:
        razorpay_payment_id = refund_entity.get("payment_id")
    if not razorpay_order_id and not razorpay_payment_id:
        return {"status": "ignored"}

    db = get_db()
    recorded = await _record_webhook_event(db, event_id, event or "unknown")
    if not recorded:
        return {"status": "duplicate"}
    updates = {
        "razorpay_payment_id": razorpay_payment_id,
        "payment_status": payment_status or "unknown",
        "updated_at": datetime.utcnow(),
    }
    if payment_status == "failed":
        updates["payment_failure_reason"] = (
            payment_entity.get("error_description")
            or payment_entity.get("error_reason")
            or "payment_failed"
        )
    if event in {"payment.captured", "order.paid"}:
        updates["payment_status"] = "paid"
        updates["paid_at"] = datetime.utcnow()

    if event and event.startswith("refund.") and refund_entity:
        updates.update(
            {
                "refund_id": refund_entity.get("id"),
                "refund_status": refund_entity.get("status", "unknown"),
                "refund_amount": refund_entity.get("amount"),
            }
        )

    query = {"razorpay_order_id": razorpay_order_id} if razorpay_order_id else {"razorpay_payment_id": razorpay_payment_id}
    order_doc = await db.orders.find_one(query)
    if order_doc and refund_entity:
        refund_id = refund_entity.get("id")
        existing = {r.get("id") for r in (order_doc.get("refunds") or [])}
        if refund_id and refund_id not in existing:
            await db.orders.update_one(
                {"_id": order_doc["_id"]},
                {
                    "$set": updates,
                    "$push": {
                        "refunds": {
                            "id": refund_id,
                            "status": refund_entity.get("status", "unknown"),
                            "amount": refund_entity.get("amount"),
                            "created_at": refund_entity.get("created_at") or datetime.utcnow(),
                        }
                    },
                },
            )
        else:
            await db.orders.update_one({"_id": order_doc["_id"]}, {"$set": updates})
    else:
        await db.orders.update_one(query, {"$set": updates})

    if updates.get("payment_status") == "paid":
        order_doc = await db.orders.find_one(query)
        if order_doc:
            await send_order_email(
                db,
                order_doc,
                "Payment received - Visista Closet",
                "Thank you for your order! Your payment has been received and your order is confirmed.",
                "We will ship your order soon and share tracking details.",
            )

    return {"status": "ok"}
