from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..db import get_db
from ..utils import serialize_doc, to_object_id

router = APIRouter(prefix="/categories", tags=["categories"])

VIRTUAL_CATEGORIES = [
    {
        "id": "virtual:new",
        "name": "New",
        "description": "All products",
        "status": "active",
    },
    {
        "id": "virtual:premium-collections",
        "name": "Premium Collections",
        "description": "Coming soon",
        "status": "coming_soon",
    },
]


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "active"


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


@router.get("")
async def list_categories():
    db = get_db()
    items = await db.categories.find().sort("created_at", -1).to_list(200)
    serialized = [serialize_doc(doc) for doc in items]
    existing_names = {doc.get("name", "").strip().lower() for doc in serialized}
    for doc in VIRTUAL_CATEGORIES:
        if doc["name"].strip().lower() not in existing_names:
            serialized.append(doc)
    return serialized


@router.post("", dependencies=[Depends(get_current_user)])
async def create_category(payload: CategoryCreate):
    db = get_db()
    doc = payload.model_dump()
    now = datetime.utcnow()
    doc["created_at"] = now
    doc["updated_at"] = now
    existing = await db.categories.find_one({"name": payload.name})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    result = await db.categories.insert_one(doc)
    created = await db.categories.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.get("/{category_id}")
async def get_category(category_id: str):
    db = get_db()
    try:
        oid = to_object_id(category_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid category id")
    doc = await db.categories.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Category not found")
    return serialize_doc(doc)


@router.put("/{category_id}", dependencies=[Depends(get_current_user)])
async def update_category(category_id: str, payload: CategoryUpdate):
    db = get_db()
    try:
        oid = to_object_id(category_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid category id")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    updates["updated_at"] = datetime.utcnow()
    result = await db.categories.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    doc = await db.categories.find_one({"_id": oid})
    return serialize_doc(doc)


@router.delete("/{category_id}", dependencies=[Depends(get_current_user)])
async def delete_category(category_id: str):
    db = get_db()
    try:
        oid = to_object_id(category_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid category id")
    result = await db.categories.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"status": "deleted"}
