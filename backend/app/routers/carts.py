from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict

from ..auth import get_current_user
from ..db import get_db
from ..utils import serialize_doc, to_object_id

router = APIRouter(prefix="/carts", tags=["carts"])


class CartItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: Optional[str] = Field(default=None, alias="id")
    name: str
    price: float = Field(ge=0)
    quantity: int = Field(ge=1)
    color: Optional[str] = None
    size: Optional[str] = None


class CartBase(BaseModel):
    customer_id: Optional[str] = None
    session_id: Optional[str] = None
    items: List[CartItem] = Field(default_factory=list)
    status: str = Field(default="active")
    subtotal: float = Field(default=0, ge=0)
    total: float = Field(default=0, ge=0)


class CartCreate(CartBase):
    pass


class CartUpdate(BaseModel):
    customer_id: Optional[str] = None
    session_id: Optional[str] = None
    items: Optional[List[CartItem]] = None
    status: Optional[str] = None
    subtotal: Optional[float] = Field(default=None, ge=0)
    total: Optional[float] = Field(default=None, ge=0)


def _calculate_totals(items: List[CartItem]) -> float:
    return sum(item.price * item.quantity for item in items)


@router.get("", dependencies=[Depends(get_current_user)])
async def list_carts():
    db = get_db()
    items = await db.carts.find().sort("created_at", -1).to_list(100)
    return [serialize_doc(doc) for doc in items]


@router.get("/by-session/{session_id}")
async def get_cart_by_session(session_id: str):
    db = get_db()
    doc = await db.carts.find_one({"session_id": session_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Cart not found")
    return serialize_doc(doc)


@router.get("/by-customer/{customer_id}")
async def get_cart_by_customer(customer_id: str):
    db = get_db()
    doc = await db.carts.find_one({"customer_id": customer_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Cart not found")
    return serialize_doc(doc)


@router.post("")
async def create_cart(payload: CartCreate):
    db = get_db()
    doc = payload.model_dump()
    subtotal = _calculate_totals(payload.items)
    doc["subtotal"] = subtotal
    doc["total"] = subtotal
    now = datetime.utcnow()
    doc["created_at"] = now
    doc["updated_at"] = now
    result = await db.carts.insert_one(doc)
    created = await db.carts.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.get("/{cart_id}")
async def get_cart(cart_id: str):
    db = get_db()
    try:
        oid = to_object_id(cart_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid cart id")
    doc = await db.carts.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Cart not found")
    return serialize_doc(doc)


@router.put("/{cart_id}")
async def update_cart(cart_id: str, payload: CartUpdate):
    db = get_db()
    try:
        oid = to_object_id(cart_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid cart id")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "items" in updates:
        subtotal = _calculate_totals(updates["items"])
        updates["subtotal"] = subtotal
        updates["total"] = subtotal
    updates["updated_at"] = datetime.utcnow()
    result = await db.carts.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cart not found")
    doc = await db.carts.find_one({"_id": oid})
    return serialize_doc(doc)


@router.delete("/{cart_id}")
async def delete_cart(cart_id: str):
    db = get_db()
    try:
        oid = to_object_id(cart_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid cart id")
    result = await db.carts.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart not found")
    return {"status": "deleted"}
