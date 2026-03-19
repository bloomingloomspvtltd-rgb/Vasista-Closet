from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..db import get_db
from ..utils import serialize_doc, to_object_id

router = APIRouter(prefix="/products", tags=["products"])


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float = Field(ge=0)
    sku: Optional[str] = None
    images: List[str] = []
    inventory: int = Field(default=0, ge=0)
    status: str = Field(default="active")
    category: Optional[str] = None
    categories: List[str] = []
    tags: List[str] = []


class SizeStock(BaseModel):
    name: str
    count: int = Field(default=0, ge=0)


class ColorOption(BaseModel):
    name: str
    hex: Optional[str] = None
    image: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    description: Optional[str] = None


class VariantStock(BaseModel):
    color: str
    size: str
    count: int = Field(default=0, ge=0)


class ProductCreate(ProductBase):
    sizes: List[SizeStock] = Field(default_factory=list)
    colors: List[ColorOption] = Field(default_factory=list)
    variants: List[VariantStock] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    sku: Optional[str] = None
    images: Optional[List[str]] = None
    inventory: Optional[int] = Field(default=None, ge=0)
    status: Optional[str] = None
    category: Optional[str] = None
    categories: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    sizes: Optional[List[SizeStock]] = None
    colors: Optional[List[ColorOption]] = None
    variants: Optional[List[VariantStock]] = None


@router.get("")
async def list_products():
    db = get_db()
    items = await db.products.find().sort("created_at", -1).to_list(100)
    return [serialize_doc(doc) for doc in items]


@router.post("", dependencies=[Depends(get_current_user)])
async def create_product(payload: ProductCreate):
    db = get_db()
    doc = payload.model_dump()
    if not doc.get("categories") and doc.get("category"):
        doc["categories"] = [doc["category"]]
    if doc.get("categories") and not doc.get("category"):
        doc["category"] = doc["categories"][0]
    now = datetime.utcnow()
    doc["created_at"] = now
    doc["updated_at"] = now
    result = await db.products.insert_one(doc)
    created = await db.products.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.get("/{product_id}")
async def get_product(product_id: str):
    db = get_db()
    try:
        oid = to_object_id(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product id")
    doc = await db.products.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    product = serialize_doc(doc)
    similar_products = await _fetch_similar_products(db, doc)
    product["similar_products"] = [serialize_doc(item) for item in similar_products]
    return product


async def _fetch_similar_products(db, doc, limit: int = 8):
    categories = doc.get("categories") or []
    if doc.get("category") and doc.get("category") not in categories:
        categories = categories + [doc.get("category")]
    tags = doc.get("tags") or []
    query = {"_id": {"$ne": doc["_id"]}}
    if categories or tags:
        or_filters = []
        if categories:
            or_filters.append({"categories": {"$in": categories}})
            or_filters.append({"category": {"$in": categories}})
        if tags:
            or_filters.append({"tags": {"$in": tags}})
        query["$or"] = or_filters
    items = (
        await db.products.find(query).sort("created_at", -1).to_list(limit)
    )
    return items


@router.put("/{product_id}", dependencies=[Depends(get_current_user)])
async def update_product(product_id: str, payload: ProductUpdate):
    db = get_db()
    try:
        oid = to_object_id(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product id")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "categories" in updates and not updates.get("category") and updates["categories"]:
        updates["category"] = updates["categories"][0]
    if "category" in updates and not updates.get("categories"):
        updates["categories"] = [updates["category"]] if updates["category"] else []
    updates["updated_at"] = datetime.utcnow()
    result = await db.products.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    doc = await db.products.find_one({"_id": oid})
    return serialize_doc(doc)


@router.delete("/{product_id}", dependencies=[Depends(get_current_user)])
async def delete_product(product_id: str):
    db = get_db()
    try:
        oid = to_object_id(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid product id")
    result = await db.products.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "deleted"}
