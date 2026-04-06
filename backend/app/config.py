from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "visista"
    cors_origins: str = "http://localhost:3000"
    admin_email: str = "admin@visista.com"
    admin_emails: str = ""
    admin_password: str = "admin123"
    jwt_secret: str = "change-this-secret"
    # Longer dev-friendly default to reduce "Token expired" noise.
    jwt_expires_minutes: int = 60 * 24 * 7
    jwt_leeway_seconds: int = 60
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True
    delhivery_api_token: str = ""
    delhivery_base_url: str = "https://staging-express.delhivery.com"
    delhivery_client_name: str = ""
    delhivery_invoice_path: str = ""
    analytics_active_window_minutes: int = 5

    class Config:
        env_file = ".env"
        env_prefix = ""


settings = Settings()
