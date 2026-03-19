from datetime import datetime
from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..auth import get_current_user
from ..db import get_db
from ..utils import serialize_doc

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_user)])
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")

    suffix = Path(file.filename or "").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{suffix}"
    destination = UPLOAD_DIR / filename

    with destination.open("wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            buffer.write(chunk)

    return {"url": f"/uploads/{filename}"}


@router.post("/seed")
async def seed_sample_data():
    db = get_db()
    now = datetime.utcnow()

    counts = {
        "products": await db.products.count_documents({}),
        "categories": await db.categories.count_documents({}),
        "customers": await db.customers.count_documents({}),
        "orders": await db.orders.count_documents({}),
        "discounts": await db.discounts.count_documents({}),
    }

    inserted = {
        "products": 0,
        "categories": 0,
        "customers": 0,
        "orders": 0,
        "discounts": 0,
    }

    if counts["categories"] == 0:
        categories = [
            {"name": "Wedding Saga", "description": "Luxe occasion wear", "status": "active"},
            {"name": "Coord Sets", "description": "Modern matching sets", "status": "active"},
            {"name": "Craft Collections", "description": "Artisan-led pieces", "status": "active"},
        ]
        for doc in categories:
            doc["created_at"] = now
            doc["updated_at"] = now
        result = await db.categories.insert_many(categories)
        inserted["categories"] = len(result.inserted_ids)

    if counts["products"] == 0:
        products = [
            {
                "name": "Ivory Banarasi Kurta",
                "description": "Handwoven Banarasi silk with zari detailing.",
                "price": 7900,
                "sku": "VST-1001",
                "images": [],
                "inventory": 12,
                "sizes": [
                    {"name": "S", "count": 3},
                    {"name": "M", "count": 4},
                    {"name": "L", "count": 3},
                    {"name": "XL", "count": 2},
                ],
                "colors": [{"name": "Ivory"}, {"name": "Gold"}],
                "variants": [
                    {"color": "Ivory", "size": "S", "count": 2},
                    {"color": "Ivory", "size": "M", "count": 2},
                    {"color": "Ivory", "size": "L", "count": 1},
                    {"color": "Gold", "size": "S", "count": 1},
                    {"color": "Gold", "size": "M", "count": 2},
                    {"color": "Gold", "size": "XL", "count": 1},
                ],
                "status": "active",
                "category": "Wedding Saga",
                "tags": ["silk", "festive"],
            },
            {
                "name": "Indigo Coord Set",
                "description": "Relaxed fit coord set with hand block prints.",
                "price": 4250,
                "sku": "VST-1002",
                "images": [],
                "inventory": 20,
                "sizes": [
                    {"name": "XS", "count": 4},
                    {"name": "S", "count": 5},
                    {"name": "M", "count": 6},
                    {"name": "L", "count": 5},
                ],
                "colors": [{"name": "Indigo"}, {"name": "Teal"}],
                "variants": [
                    {"color": "Indigo", "size": "XS", "count": 2},
                    {"color": "Indigo", "size": "S", "count": 3},
                    {"color": "Indigo", "size": "M", "count": 4},
                    {"color": "Teal", "size": "S", "count": 2},
                    {"color": "Teal", "size": "M", "count": 2},
                    {"color": "Teal", "size": "L", "count": 2},
                ],
                "status": "active",
                "category": "Coord Sets",
                "tags": ["everyday"],
            },
        ]
        for doc in products:
            doc["created_at"] = now
            doc["updated_at"] = now
        result = await db.products.insert_many(products)
        inserted["products"] = len(result.inserted_ids)

    if counts["customers"] == 0:
        customers = [
            {
                "first_name": "Riya",
                "last_name": "Mehta",
                "email": "riya@example.com",
                "phone": "+91 98765 43210",
                "addresses": [],
            },
            {
                "first_name": "Ananya",
                "last_name": "Sharma",
                "email": "ananya@example.com",
                "phone": "+91 99887 66554",
                "addresses": [],
            },
        ]
        for doc in customers:
            doc["created_at"] = now
            doc["updated_at"] = now
        result = await db.customers.insert_many(customers)
        inserted["customers"] = len(result.inserted_ids)

    if counts["discounts"] == 0:
        discounts = [
            {
                "code": "FESTIVE25",
                "type": "percentage",
                "value": 25,
                "starts_at": None,
                "ends_at": None,
                "is_active": True,
                "usage_limit": None,
                "used_count": 0,
            }
        ]
        for doc in discounts:
            doc["created_at"] = now
            doc["updated_at"] = now
        result = await db.discounts.insert_many(discounts)
        inserted["discounts"] = len(result.inserted_ids)

    if counts["orders"] == 0:
        order = {
            "customer_id": None,
            "items": [
                {"name": "Ivory Banarasi Kurta", "price": 7900, "quantity": 1},
                {"name": "Indigo Coord Set", "price": 4250, "quantity": 1},
            ],
            "status": "pending",
            "subtotal": 12150,
            "discount_id": None,
            "discount_amount": 0,
            "total": 12150,
            "created_at": now,
            "updated_at": now,
        }
        result = await db.orders.insert_one(order)
        inserted["orders"] = 1 if result.inserted_id else 0

    return {
        "status": "seeded",
        "existing": counts,
        "inserted": inserted,
    }


@router.get("/categories")
async def list_admin_categories():
    db = get_db()
    items = await db.categories.find().sort("created_at", -1).to_list(200)
    return [serialize_doc(doc) for doc in items]
