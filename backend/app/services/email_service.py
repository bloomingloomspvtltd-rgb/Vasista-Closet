import logging
import smtplib
from email.message import EmailMessage

from ..config import settings

logger = logging.getLogger("visista.email")


def _is_email_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from)


def send_email(to_email: str, subject: str, body: str, attachments=None) -> bool:
    if not to_email or not _is_email_configured():
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from
    message["To"] = to_email
    message.set_content(body)
    if attachments:
        for attachment in attachments:
            message.add_attachment(
                attachment["content"],
                maintype=attachment.get("maintype", "application"),
                subtype=attachment.get("subtype", "octet-stream"),
                filename=attachment.get("filename", "attachment"),
            )

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            if settings.smtp_use_tls:
                server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(message)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to_email)
        return False


__all__ = ["send_email"]
