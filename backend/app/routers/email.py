from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from ..config import settings
from ..services.email_service import send_email

router = APIRouter(prefix="/email", tags=["email"])


class TestEmailPayload(BaseModel):
    to_email: EmailStr | None = None
    subject: str | None = None
    body: str | None = None
    send_to_admins: bool = False


@router.post("/test")
async def send_test_email(payload: TestEmailPayload):
    subject = payload.subject or "Order confirmed - Visista Closet"
    body = payload.body or "Your order is confirmed and will be delivered soon."
    recipients: list[str] = []
    if payload.send_to_admins:
        admin_emails_raw = (settings.admin_emails or "").strip()
        recipients = [e.strip() for e in admin_emails_raw.split(",") if e.strip()]
        if not recipients and (settings.admin_email or "").strip():
            recipients = [(settings.admin_email or "").strip()]
    elif payload.to_email:
        recipients = [payload.to_email]

    if not recipients:
        raise HTTPException(status_code=400, detail="Recipient email is required")

    any_sent = False
    for recipient in recipients:
        sent = send_email(recipient, subject, body)
        any_sent = any_sent or sent

    if not any_sent:
        raise HTTPException(status_code=500, detail="Failed to send test email")

    return {"status": "sent", "to": recipients}
