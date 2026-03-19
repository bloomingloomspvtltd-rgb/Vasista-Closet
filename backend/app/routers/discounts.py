from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..db import get_db
from ..utils import serialize_doc, to_object_id

router = APIRouter(prefix="/discounts", tags=["discounts"])


class DiscountBase(BaseModel):
    code: str
    type: str = Field(default="percentage")  # percentage or fixed
    value: float = Field(ge=0)
    min_order_value: Optional[float] = Field(default=None, ge=0)
    max_discount: Optional[float] = Field(default=None, ge=0)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: bool = True
    usage_limit: Optional[int] = Field(default=None, ge=0)
    used_count: int = Field(default=0, ge=0)


class DiscountCreate(DiscountBase):
    pass


class DiscountUpdate(BaseModel):
    code: Optional[str] = None
    type: Optional[str] = None
    value: Optional[float] = Field(default=None, ge=0)
    min_order_value: Optional[float] = Field(default=None, ge=0)
    max_discount: Optional[float] = Field(default=None, ge=0)
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_active: Optional[bool] = None
    usage_limit: Optional[int] = Field(default=None, ge=0)
    used_count: Optional[int] = Field(default=None, ge=0)


@router.get("", dependencies=[Depends(get_current_user)])
async def list_discounts():
    db = get_db()
    items = await db.discounts.find().sort("created_at", -1).to_list(100)
    return [serialize_doc(doc) for doc in items]


@router.get("/public")
async def list_public_discounts():
    db = get_db()
    now = datetime.utcnow()
    items = await db.discounts.find({"is_active": True}).sort("created_at", -1).to_list(200)
    results = []
    for doc in items:
        starts_at = doc.get("starts_at")
        ends_at = doc.get("ends_at")
        if starts_at and starts_at > now:
            continue
        if ends_at and ends_at < now:
            continue
        usage_limit = doc.get("usage_limit")
        used_count = doc.get("used_count", 0)
        if usage_limit is not None and used_count >= usage_limit:
            continue
        results.append(serialize_doc(doc))
    return results


@router.get("/public/{code}")
async def validate_discount(code: str, subtotal: Optional[float] = None):
    db = get_db()
    normalized = (code or "").strip().upper()
    if not normalized:
        raise HTTPException(status_code=400, detail="Coupon code is required")
    doc = await db.discounts.find_one({"code": normalized})
    if not doc:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    now = datetime.utcnow()
    if not doc.get("is_active", True):
        raise HTTPException(status_code=400, detail="Coupon is inactive")
    starts_at = doc.get("starts_at")
    ends_at = doc.get("ends_at")
    if starts_at and starts_at > now:
        raise HTTPException(status_code=400, detail="Coupon not active yet")
    if ends_at and ends_at < now:
        raise HTTPException(status_code=400, detail="Coupon expired")
    usage_limit = doc.get("usage_limit")
    used_count = doc.get("used_count", 0)
    if usage_limit is not None and used_count >= usage_limit:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    min_order_value = doc.get("min_order_value")
    if subtotal is not None and min_order_value is not None and subtotal < min_order_value:
        raise HTTPException(status_code=400, detail="Cart value below minimum for this coupon")
    return serialize_doc(doc)


@router.post("", dependencies=[Depends(get_current_user)])
async def create_discount(payload: DiscountCreate):
    db = get_db()
    doc = payload.model_dump()
    now = datetime.utcnow()
    doc["created_at"] = now
    doc["updated_at"] = now
    result = await db.discounts.insert_one(doc)
    created = await db.discounts.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.get("/{discount_id}", dependencies=[Depends(get_current_user)])
async def get_discount(discount_id: str):
    db = get_db()
    try:
        oid = to_object_id(discount_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid discount id")
    doc = await db.discounts.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Discount not found")
    return serialize_doc(doc)


@router.put("/{discount_id}", dependencies=[Depends(get_current_user)])
async def update_discount(discount_id: str, payload: DiscountUpdate):
    db = get_db()
    try:
        oid = to_object_id(discount_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid discount id")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.utcnow()
    result = await db.discounts.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Discount not found")
    doc = await db.discounts.find_one({"_id": oid})
    return serialize_doc(doc)


@router.delete("/{discount_id}", dependencies=[Depends(get_current_user)])
async def delete_discount(discount_id: str):
    db = get_db()
    try:
        oid = to_object_id(discount_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid discount id")
    result = await db.discounts.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Discount not found")
    return {"status": "deleted"}
