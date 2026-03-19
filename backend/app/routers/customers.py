from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from ..auth import get_current_user
from ..db import get_db
from ..utils import serialize_doc, to_object_id

router = APIRouter(prefix="/customers", tags=["customers"])


class Address(BaseModel):
    label: Optional[str] = None
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None


class CustomerBase(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    addresses: List[Address] = []


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    addresses: Optional[List[Address]] = None


class CustomerPhoneAuth(BaseModel):
    phone: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None


class CustomerEmailAuth(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


class CustomerProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    addresses: Optional[List[Address]] = None


@router.get("", dependencies=[Depends(get_current_user)])
async def list_customers():
    db = get_db()
    items = await db.customers.find().sort("created_at", -1).to_list(100)
    return [serialize_doc(doc) for doc in items]


@router.post("")
async def create_customer(payload: CustomerCreate):
    db = get_db()
    doc = payload.model_dump()
    now = datetime.utcnow()
    doc["created_at"] = now
    doc["updated_at"] = now
    result = await db.customers.insert_one(doc)
    created = await db.customers.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.post("/phone")
async def upsert_customer_by_phone(payload: CustomerPhoneAuth):
    db = get_db()
    phone = (payload.phone or "").strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required")
    existing = await db.customers.find_one({"phone": phone})
    if existing:
        response = serialize_doc(existing)
        response["is_new"] = False
        return response
    now = datetime.utcnow()
    doc = {
        "first_name": (payload.first_name or "Customer").strip() or "Customer",
        "last_name": (payload.last_name or "").strip() or None,
        "email": (payload.email or None),
        "phone": phone,
        "addresses": [],
        "created_at": now,
        "updated_at": now,
    }
    result = await db.customers.insert_one(doc)
    created = await db.customers.find_one({"_id": result.inserted_id})
    response = serialize_doc(created)
    response["is_new"] = True
    return response


@router.post("/email")
async def upsert_customer_by_email(payload: CustomerEmailAuth):
    db = get_db()
    email = (payload.email or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    existing = await db.customers.find_one({"email": email})
    if existing:
        response = serialize_doc(existing)
        response["is_new"] = False
        return response
    now = datetime.utcnow()
    doc = {
        "first_name": (payload.first_name or "Customer").strip() or "Customer",
        "last_name": (payload.last_name or "").strip() or None,
        "email": email,
        "phone": (payload.phone or None),
        "addresses": [],
        "created_at": now,
        "updated_at": now,
    }
    result = await db.customers.insert_one(doc)
    created = await db.customers.find_one({"_id": result.inserted_id})
    response = serialize_doc(created)
    response["is_new"] = True
    return response


@router.put("/profile/{customer_id}")
async def update_customer_profile(customer_id: str, payload: CustomerProfileUpdate):
    db = get_db()
    try:
        oid = to_object_id(customer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid customer id")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.utcnow()
    result = await db.customers.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    doc = await db.customers.find_one({"_id": oid})
    return serialize_doc(doc)


@router.get("/{customer_id}", dependencies=[Depends(get_current_user)])
async def get_customer(customer_id: str):
    db = get_db()
    try:
        oid = to_object_id(customer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid customer id")
    doc = await db.customers.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Customer not found")
    return serialize_doc(doc)


@router.put("/{customer_id}", dependencies=[Depends(get_current_user)])
async def update_customer(customer_id: str, payload: CustomerUpdate):
    db = get_db()
    try:
        oid = to_object_id(customer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid customer id")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.utcnow()
    result = await db.customers.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    doc = await db.customers.find_one({"_id": oid})
    return serialize_doc(doc)


@router.delete("/{customer_id}", dependencies=[Depends(get_current_user)])
async def delete_customer(customer_id: str):
    db = get_db()
    try:
        oid = to_object_id(customer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid customer id")
    result = await db.customers.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"status": "deleted"}
