from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..db import get_db
from ..utils import serialize_doc, to_object_id
from ..services.order_email_service import send_admin_order_email, send_order_email
from ..services.delhivery_service import create_delhivery_order_for_order

router = APIRouter(prefix="/orders", tags=["orders"])


class OrderItem(BaseModel):
    product_id: Optional[str] = None
    name: str
    price: float = Field(ge=0)
    quantity: int = Field(ge=1)
    sku: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    image: Optional[str] = None


class ShippingAddress(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None


class OrderBase(BaseModel):
    customer_id: Optional[str] = None
    items: List[OrderItem]
    status: str = Field(default="pending")
    subtotal: float = Field(ge=0)
    discount_id: Optional[str] = None
    discount_amount: float = Field(default=0, ge=0)
    total: float = Field(ge=0)
    payment_method: Optional[str] = None
    payment_provider: Optional[str] = None
    payment_status: Optional[str] = None
    shipping_address: Optional[ShippingAddress] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    customer_id: Optional[str] = None
    items: Optional[List[OrderItem]] = None
    status: Optional[str] = None
    subtotal: Optional[float] = Field(default=None, ge=0)
    discount_id: Optional[str] = None
    discount_amount: Optional[float] = Field(default=None, ge=0)
    total: Optional[float] = Field(default=None, ge=0)
    payment_method: Optional[str] = None
    payment_provider: Optional[str] = None
    payment_status: Optional[str] = None
    shipping_address: Optional[ShippingAddress] = None


async def _enrich_order(db, doc: dict) -> dict:
    if not doc:
        return doc
    items = doc.get("items") or []
    product_ids = []
    for item in items:
        pid = item.get("product_id")
        if not pid:
            continue
        try:
            product_ids.append(to_object_id(pid))
        except ValueError:
            continue
    product_map = {}
    if product_ids:
        products = await db.products.find({"_id": {"$in": product_ids}}).to_list(200)
        for product in products:
            product_map[str(product["_id"])] = product
    for item in items:
        pid = item.get("product_id")
        if not pid:
            continue
        product = product_map.get(str(pid))
        if not product:
            continue
        if not item.get("name"):
            item["name"] = product.get("name")
        if not item.get("sku") and product.get("sku"):
            item["sku"] = product.get("sku")
        if not item.get("image"):
            images = product.get("images") or []
            if images:
                item["image"] = images[0]
    doc["items"] = items
    if not doc.get("shipping_address") and doc.get("customer_id"):
        try:
            cid = to_object_id(doc.get("customer_id"))
            customer = await db.customers.find_one({"_id": cid})
        except ValueError:
            customer = None
        if customer:
            addresses = customer.get("addresses") or []
            if addresses:
                address = addresses[0] or {}
                doc["shipping_address"] = {
                    **address,
                    "name": " ".join(
                        filter(None, [customer.get("first_name"), customer.get("last_name")])
                    )
                    or customer.get("first_name")
                    or "Customer",
                    "email": customer.get("email"),
                    "phone": customer.get("phone"),
                }
    return doc


@router.get("", dependencies=[Depends(get_current_user)])
async def list_orders():
    db = get_db()
    items = await db.orders.find().sort("created_at", -1).to_list(100)
    return [serialize_doc(doc) for doc in items]


@router.post("")
async def create_order(payload: OrderCreate):
    db = get_db()
    doc = payload.model_dump()
    now = datetime.utcnow()
    doc["created_at"] = now
    doc["updated_at"] = now
    doc["payment_method"] = "cod"
    doc["payment_provider"] = "cod"
    doc["payment_status"] = "pending"
    result = await db.orders.insert_one(doc)
    created = await db.orders.find_one({"_id": result.inserted_id})
    if created:
        delhivery_info = await create_delhivery_order_for_order(db, created)
        if delhivery_info:
            await db.orders.update_one(
                {"_id": created["_id"]},
                {"$set": {"delhivery": delhivery_info, "updated_at": datetime.utcnow()}},
            )
            created = await db.orders.find_one({"_id": created["_id"]})
        await send_order_email(
            db,
            created,
            "Order confirmed - Cash on Delivery - Visista Closet",
            "Your order has been placed successfully and is confirmed.",
            "It will be delivered soon. Please keep cash ready at delivery.",
        )
        await send_admin_order_email(
            db,
            created,
            "New order received - Visista Closet",
        )
    return serialize_doc(created)


@router.get("/customer/{customer_id}")
async def list_orders_by_customer(customer_id: str):
    db = get_db()
    items = (
        await db.orders.find({"customer_id": customer_id})
        .sort("created_at", -1)
        .to_list(100)
    )
    return [serialize_doc(doc) for doc in items]


@router.get("/{order_id}", dependencies=[Depends(get_current_user)])
async def get_order(order_id: str):
    db = get_db()
    try:
        oid = to_object_id(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order id")
    doc = await db.orders.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    doc = await _enrich_order(db, doc)
    return serialize_doc(doc)


@router.put("/{order_id}", dependencies=[Depends(get_current_user)])
async def update_order(order_id: str, payload: OrderUpdate):
    db = get_db()
    try:
        oid = to_object_id(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order id")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.utcnow()
    result = await db.orders.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    doc = await db.orders.find_one({"_id": oid})
    return serialize_doc(doc)


@router.delete("/{order_id}", dependencies=[Depends(get_current_user)])
async def delete_order(order_id: str):
    db = get_db()
    try:
        oid = to_object_id(order_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid order id")
    result = await db.orders.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"status": "deleted"}
