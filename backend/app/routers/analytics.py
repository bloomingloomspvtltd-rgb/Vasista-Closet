from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..db import get_db
from ..config import settings

router = APIRouter(prefix="/analytics", tags=["analytics"])


class VisitPayload(BaseModel):
    session_id: str = Field(..., min_length=6)
    member_id: Optional[str] = None
    path: Optional[str] = None
    referrer: Optional[str] = None
    user_agent: Optional[str] = None
    device_type: Optional[str] = None


def _utc_now() -> datetime:
    return datetime.utcnow()


def _parse_date_param(value: str) -> datetime:
    """Parse YYYY-MM-DD or ISO datetime into naive UTC datetime."""
    try:
        dt = datetime.fromisoformat(value)
    except ValueError:
        try:
            d = date.fromisoformat(value)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid date format") from exc
        dt = datetime(d.year, d.month, d.day)

    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _active_window_minutes() -> int:
    return int(getattr(settings, "analytics_active_window_minutes", 5))


def _normalize_device_type(value: Optional[str]) -> str:
    if not value:
        return "other"
    cleaned = value.strip().lower()
    if cleaned in {"mobile", "desktop", "tablet"}:
        return cleaned
    return "other"


@router.post("/visit")
async def record_visit(payload: VisitPayload, request: Request):
    db = get_db()
    now = _utc_now()
    ip = request.client.host if request.client else None

    visit_doc = {
        "session_id": payload.session_id,
        "member_id": payload.member_id,
        "path": payload.path,
        "referrer": payload.referrer,
        "user_agent": payload.user_agent,
        "device_type": _normalize_device_type(payload.device_type),
        "ip": ip,
        "created_at": now,
    }
    await db.analytics_visits.insert_one(visit_doc)

    active_doc = {
        "session_id": payload.session_id,
        "member_id": payload.member_id,
        "path": payload.path,
        "user_agent": payload.user_agent,
        "device_type": _normalize_device_type(payload.device_type),
        "ip": ip,
        "last_seen": now,
    }
    await db.analytics_active.update_one(
        {"session_id": payload.session_id},
        {
            "$set": active_doc,
            "$setOnInsert": {"first_seen": now},
        },
        upsert=True,
    )

    return {"status": "ok"}


@router.get("/active", dependencies=[Depends(get_current_user)])
async def get_active(limit: int = Query(50, ge=1, le=200)):
    db = get_db()
    window_minutes = _active_window_minutes()
    cutoff = _utc_now() - timedelta(minutes=window_minutes)

    active_cursor = db.analytics_active.find({"last_seen": {"$gte": cutoff}}).sort(
        "last_seen", -1
    )
    active_list = await active_cursor.to_list(limit)

    active_sessions = len(active_list)
    active_members = len({doc.get("member_id") for doc in active_list if doc.get("member_id")})

    return {
        "window_minutes": window_minutes,
        "active_sessions": active_sessions,
        "active_members": active_members,
        "sessions": [
            {
                "session_id": doc.get("session_id"),
                "member_id": doc.get("member_id"),
                "path": doc.get("path"),
                "last_seen": doc.get("last_seen"),
            }
            for doc in active_list
        ],
    }


@router.get("/summary", dependencies=[Depends(get_current_user)])
async def get_summary(
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    db = get_db()
    now = _utc_now()
    start_dt = _parse_date_param(start) if start else now - timedelta(days=30)
    end_dt = _parse_date_param(end) if end else now

    if end_dt < start_dt:
        raise HTTPException(status_code=400, detail="end must be >= start")

    total_members = await db.customers.count_documents({})
    total_visits = await db.analytics_visits.count_documents(
        {"created_at": {"$gte": start_dt, "$lte": end_dt}}
    )
    device_pipeline = [
        {"$match": {"created_at": {"$gte": start_dt, "$lte": end_dt}}},
        {
            "$group": {
                "_id": "$device_type",
                "count": {"$sum": 1},
            }
        },
    ]
    device_counts = await db.analytics_visits.aggregate(device_pipeline).to_list(10)
    device_summary = {"mobile": 0, "desktop": 0, "tablet": 0, "other": 0}
    for row in device_counts:
        device_summary[_normalize_device_type(row.get("_id"))] = row.get("count", 0)

    window_minutes = _active_window_minutes()
    cutoff = now - timedelta(minutes=window_minutes)
    active_docs = await db.analytics_active.find({"last_seen": {"$gte": cutoff}}).to_list(1000)
    active_sessions = len(active_docs)
    active_members = len({doc.get("member_id") for doc in active_docs if doc.get("member_id")})

    return {
        "range_start": start_dt,
        "range_end": end_dt,
        "total_members": total_members,
        "total_visits": total_visits,
        "active_sessions": active_sessions,
        "active_members": active_members,
        "window_minutes": window_minutes,
        "device_sessions": device_summary,
    }


@router.get("/visits", dependencies=[Depends(get_current_user)])
async def get_visit_series(
    start: Optional[str] = None,
    end: Optional[str] = None,
    timezone_name: str = Query("UTC", alias="tz"),
):
    db = get_db()
    now = _utc_now()
    start_dt = _parse_date_param(start) if start else now - timedelta(days=30)
    end_dt = _parse_date_param(end) if end else now

    if end_dt < start_dt:
        raise HTTPException(status_code=400, detail="end must be >= start")

    pipeline = [
        {"$match": {"created_at": {"$gte": start_dt, "$lte": end_dt}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at",
                        "timezone": timezone_name,
                    }
                },
                "visits": {"$sum": 1},
                "unique_members": {"$addToSet": "$member_id"},
                "unique_sessions": {"$addToSet": "$session_id"},
            }
        },
        {
            "$project": {
                "_id": 0,
                "date": "$_id",
                "visits": 1,
                "unique_members": {
                    "$size": {"$setDifference": ["$unique_members", [None]]}
                },
                "unique_sessions": {"$size": "$unique_sessions"},
            }
        },
        {"$sort": {"date": 1}},
    ]

    series = await db.analytics_visits.aggregate(pipeline).to_list(1000)
    return {
        "range_start": start_dt,
        "range_end": end_dt,
        "timezone": timezone_name,
        "series": series,
    }
