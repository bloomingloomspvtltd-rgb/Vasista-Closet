import json
import logging
from datetime import datetime

import requests

from ..config import settings
from ..utils import to_object_id

logger = logging.getLogger("visista.delhivery")


def _is_configured() -> bool:
    token = (settings.delhivery_api_token or "").strip()
    base = (settings.delhivery_base_url or "").strip()
    client_name = (settings.delhivery_client_name or "").strip()
    if not token or not base:
        return False
    if not client_name or client_name.lower() == "your_client_name":
        return False
    return True


def _base_url() -> str:
    return (settings.delhivery_base_url or "").strip().rstrip("/")


def _auth_headers() -> dict:
    return {"Authorization": f"Token {(settings.delhivery_api_token or '').strip()}"}


async def _get_customer(db, customer_id: str) -> dict | None:
    if not customer_id:
        return None
    try:
        oid = to_object_id(customer_id)
    except ValueError:
        return None
    return await db.customers.find_one({"_id": oid})


def _first_address(customer: dict | None) -> dict | None:
    if not customer:
        return None
    addresses = customer.get("addresses") or []
    if not isinstance(addresses, list) or not addresses:
        return None
    return addresses[0] if isinstance(addresses[0], dict) else None


def _full_name(customer: dict | None) -> str:
    if not customer:
        return "Customer"
    first_name = (customer.get("first_name") or "").strip()
    last_name = (customer.get("last_name") or "").strip()
    return (f"{first_name} {last_name}".strip() or "Customer")


def _products_desc(order_doc: dict) -> str:
    items = order_doc.get("items") or []
    names = []
    for item in items:
        name = (item.get("name") or "").strip()
        if name:
            names.append(name)
    return ", ".join(names) if names else "Items"


def _total_quantity(order_doc: dict) -> int:
    items = order_doc.get("items") or []
    qty = 0
    for item in items:
        try:
            qty += int(item.get("quantity") or 0)
        except (TypeError, ValueError):
            continue
    return max(qty, 1)


def _build_payload(order_doc: dict, customer: dict) -> dict:
    address = _first_address(customer) or {}
    line1 = (address.get("line1") or "").strip()
    line2 = (address.get("line2") or "").strip()
    city = (address.get("city") or "").strip()
    state = (address.get("state") or "").strip()
    pin = (address.get("postal_code") or "").strip()
    country = (address.get("country") or "").strip() or "India"

    name = _full_name(customer)
    phone = (customer.get("phone") or "").strip()

    payment_method = (order_doc.get("payment_method") or "").strip().lower()
    payment_mode = "COD" if payment_method == "cod" else "Prepaid"
    total_amount = float(order_doc.get("total") or 0)
    cod_amount = total_amount if payment_mode == "COD" else 0.0

    quantity = _total_quantity(order_doc)
    weight = max(0.5, 0.5 * quantity)

    shipment = {
        "name": name,
        "phone": phone,
        "add": " ".join([p for p in [line1, line2] if p]),
        "city": city,
        "state": state,
        "pin": pin,
        "country": country,
        "payment_mode": payment_mode,
        "cod_amount": cod_amount,
        "total_amount": total_amount,
        "order": str(order_doc.get("_id")),
        "products_desc": _products_desc(order_doc),
        "quantity": quantity,
        "weight": weight,
        "pickup_location": (settings.delhivery_client_name or "").strip(),
        "client": (settings.delhivery_client_name or "").strip(),
        "seller_name": (settings.delhivery_client_name or "").strip(),
        "seller_inv": str(order_doc.get("_id")),
        "seller_inv_date": datetime.utcnow().strftime("%Y-%m-%d"),
    }
    return {"shipments": [shipment]}


async def create_delhivery_order_for_order(db, order_doc: dict) -> dict:
    if not _is_configured():
        return {"status": "skipped", "reason": "Delhivery is not configured"}

    customer = await _get_customer(db, order_doc.get("customer_id"))
    if not customer:
        return {"status": "skipped", "reason": "Customer not found"}

    address = _first_address(customer)
    if not address:
        return {"status": "skipped", "reason": "Customer address missing"}

    phone = (customer.get("phone") or "").strip()
    pin = (address.get("postal_code") or "").strip()
    line1 = (address.get("line1") or "").strip()
    if not phone or not pin or not line1:
        return {
            "status": "skipped",
            "reason": "Customer phone, pin, and address line1 are required",
        }

    payload = _build_payload(order_doc, customer)
    url = f"{_base_url()}/api/cmu/create.json"
    data = {
        "format": "json",
        "data": json.dumps(payload),
    }
    try:
        response = requests.post(url, headers=_auth_headers(), data=data, timeout=30)
    except requests.RequestException as exc:
        logger.exception("Delhivery order request failed")
        return {"status": "error", "error": str(exc)}

    if response.status_code >= 400:
        return {
            "status": "error",
            "status_code": response.status_code,
            "error": response.text or "Delhivery error",
        }

    try:
        body = response.json()
    except ValueError:
        body = {"raw": response.text}
    return {"status": "success", "response": body}


__all__ = ["create_delhivery_order_for_order"]
