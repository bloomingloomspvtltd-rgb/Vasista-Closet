from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .config import settings
from .routers import (
    admin,
    analytics,
    auth,
    carts,
    categories,
    customers,
    discounts,
    email,
    orders,
    payments,
    products,
    shipping,
)

app = FastAPI(title="Visista API", version="1.0.0")

uploads_dir = Path(settings.uploads_dir).expanduser() if settings.uploads_dir else Path(__file__).resolve().parents[1] / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
if not origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(shipping.router)
app.include_router(carts.router)
app.include_router(discounts.router)
app.include_router(categories.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(email.router)
app.include_router(analytics.router)
