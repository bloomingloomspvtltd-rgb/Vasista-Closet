from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas


def build_invoice_pdf(order_doc, customer_doc):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    c.setFont("Helvetica-Bold", 16)
    c.drawString(20 * mm, height - 20 * mm, "Visista Closet - Invoice")

    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, height - 30 * mm, f"Order ID: {order_doc.get('_id')}")
    c.drawString(20 * mm, height - 36 * mm, f"Date: {datetime.utcnow().strftime('%Y-%m-%d')}")

    customer_name = " ".join(
        [str(customer_doc.get("first_name") or "").strip(), str(customer_doc.get("last_name") or "").strip()]
    ).strip() or "Customer"
    c.drawString(20 * mm, height - 46 * mm, f"Customer: {customer_name}")
    c.drawString(20 * mm, height - 52 * mm, f"Email: {customer_doc.get('email') or ''}")

    y = height - 65 * mm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, y, "Item")
    c.drawString(110 * mm, y, "Qty")
    c.drawString(130 * mm, y, "Price")
    c.drawString(160 * mm, y, "Total")

    c.setFont("Helvetica", 10)
    y -= 6 * mm
    items = order_doc.get("items") or []
    for item in items:
        name = str(item.get("name") or "")
        qty = item.get("quantity") or 0
        price = item.get("price") or 0
        total = price * qty
        c.drawString(20 * mm, y, name[:40])
        c.drawRightString(120 * mm, y, str(qty))
        c.drawRightString(150 * mm, y, f"{price:.2f}")
        c.drawRightString(190 * mm, y, f"{total:.2f}")
        y -= 6 * mm
        if y < 30 * mm:
            c.showPage()
            y = height - 30 * mm

    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(190 * mm, y - 4 * mm, f"Total: {order_doc.get('total', 0):.2f}")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer.read()
