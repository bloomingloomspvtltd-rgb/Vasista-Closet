from typing import Any

from ..config import settings
from ..services.email_service import send_email
from ..services.invoice_service import build_invoice_pdf
from ..utils import to_object_id


def _format_money(value: Any) -> str:
    try:
        return f"{float(value):.2f}"
    except (TypeError, ValueError):
        return "0.00"


def _format_address(address: dict | None) -> str | None:
    if not address:
        return None
    parts = [
        address.get("label"),
        address.get("line1"),
        address.get("line2"),
        address.get("city"),
        address.get("state"),
        address.get("postal_code"),
        address.get("country"),
    ]
    cleaned = [p.strip() for p in parts if isinstance(p, str) and p.strip()]
    if not cleaned:
        return None
    return ", ".join(cleaned)


def _build_order_email_body(
    order_doc: dict,
    customer_doc: dict,
    intro_line: str,
    delivery_line: str,
) -> str:
    first_name = (customer_doc.get("first_name") or "").strip()
    last_name = (customer_doc.get("last_name") or "").strip()
    full_name = f"{first_name} {last_name}".strip() or "Customer"

    address = None
    addresses = customer_doc.get("addresses") or []
    if isinstance(addresses, list) and addresses:
        address = _format_address(addresses[0] if isinstance(addresses[0], dict) else None)

    items = order_doc.get("items") or []
    lines = [
        f"Hi {full_name},",
        "",
        intro_line,
        f"Delivery update: {delivery_line}",
        "",
        f"Order ID: {order_doc.get('_id')}",
        f"Order status: {order_doc.get('status', 'pending')}",
    ]
    if address:
        lines.append(f"Delivery address: {address}")
    lines.extend(["", "Items:"])
    if items:
        for item in items:
            name = item.get("name", "Item")
            qty = item.get("quantity", 1)
            price = _format_money(item.get("price", 0))
            line_total = _format_money(item.get("price", 0) * item.get("quantity", 1))
            lines.append(f"- {name} x {qty} @ {price} = {line_total}")
    else:
        lines.append("- (No items listed)")

    lines.extend(
        [
            "",
            f"Subtotal: {_format_money(order_doc.get('subtotal', 0))}",
            f"Discount: {_format_money(order_doc.get('discount_amount', 0))}",
            f"Total: {_format_money(order_doc.get('total', 0))}",
            "",
            "Your invoice is attached to this email.",
            "",
            "Thank you for shopping with Visista Closet.",
        ]
    )
    return "\n".join(lines)


async def _get_customer(db, customer_id: str) -> dict | None:
    if not customer_id:
        return None
    try:
        oid = to_object_id(customer_id)
    except ValueError:
        return None
    return await db.customers.find_one({"_id": oid})


async def send_order_email(
    db,
    order_doc: dict,
    subject: str,
    intro_line: str,
    delivery_line: str,
) -> bool:
    customer_id = order_doc.get("customer_id")
    customer = await _get_customer(db, customer_id)
    if not customer:
        return False
    email = customer.get("email")
    if not email:
        return False

    body = _build_order_email_body(order_doc, customer, intro_line, delivery_line)
    pdf = build_invoice_pdf(order_doc, customer)
    return send_email(
        email,
        subject,
        body,
        attachments=[
            {
                "content": pdf,
                "maintype": "application",
                "subtype": "pdf",
                "filename": "invoice.pdf",
            }
        ],
    )


async def send_admin_order_email(
    db,
    order_doc: dict,
    subject: str,
) -> bool:
    admin_emails_raw = (settings.admin_emails or "").strip()
    admin_emails = [e.strip() for e in admin_emails_raw.split(",") if e.strip()]
    if not admin_emails:
        fallback = (settings.admin_email or "").strip()
        if fallback:
            admin_emails = [fallback]
    if not admin_emails:
        return False
    customer = await _get_customer(db, order_doc.get("customer_id"))
    if not customer:
        return False
    customer_email = customer.get("email") or ""
    customer_name = (
        f"{(customer.get('first_name') or '').strip()} {(customer.get('last_name') or '').strip()}"
    ).strip() or "Customer"
    address = None
    addresses = customer.get("addresses") or []
    if isinstance(addresses, list) and addresses:
        address = _format_address(addresses[0] if isinstance(addresses[0], dict) else None)

    items = order_doc.get("items") or []
    lines = [
        "New order received.",
        "",
        f"Order ID: {order_doc.get('_id')}",
        f"Order status: {order_doc.get('status', 'pending')}",
        f"Customer: {customer_name}",
        f"Customer email: {customer_email}",
    ]
    if address:
        lines.append(f"Delivery address: {address}")
    lines.extend(["", "Items:"])
    if items:
        for item in items:
            name = item.get("name", "Item")
            qty = item.get("quantity", 1)
            price = _format_money(item.get("price", 0))
            line_total = _format_money(item.get("price", 0) * item.get("quantity", 1))
            lines.append(f"- {name} x {qty} @ {price} = {line_total}")
    else:
        lines.append("- (No items listed)")
    lines.extend(
        [
            "",
            f"Subtotal: {_format_money(order_doc.get('subtotal', 0))}",
            f"Discount: {_format_money(order_doc.get('discount_amount', 0))}",
            f"Total: {_format_money(order_doc.get('total', 0))}",
        ]
    )
    body = "\n".join(lines)
    pdf = build_invoice_pdf(order_doc, customer)
    any_sent = False
    for admin_email in admin_emails:
        sent = send_email(
            admin_email,
            subject,
            body,
            attachments=[
                {
                    "content": pdf,
                    "maintype": "application",
                    "subtype": "pdf",
                    "filename": "invoice.pdf",
                }
            ],
        )
        any_sent = any_sent or sent
    return any_sent


__all__ = ["send_order_email", "send_admin_order_email"]
