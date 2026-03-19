import json
from datetime import date

import requests
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..config import settings

router = APIRouter(prefix="/shipping/delhivery", tags=["shipping"])


class DelhiveryPickupRequest(BaseModel):
    pickup_date: date
    pickup_time: str = Field(..., description="HH:MM:SS")
    pickup_location: str
    expected_package_count: int = Field(..., ge=1)


class DelhiveryOrderPayload(BaseModel):
    data: dict


def _base_url() -> str:
    base = (settings.delhivery_base_url or "").strip()
    if not base:
        raise HTTPException(status_code=500, detail="Delhivery base URL is not configured")
    return base.rstrip("/")


def _auth_headers() -> dict:
    token = (settings.delhivery_api_token or "").strip()
    if not token:
        raise HTTPException(status_code=500, detail="Delhivery API token is not configured")
    return {"Authorization": f"Token {token}"}


@router.get("/serviceability")
async def check_serviceability(request: Request):
    params = dict(request.query_params)
    if not params:
        raise HTTPException(status_code=400, detail="Query params are required")
    url = f"{_base_url()}/c/api/pin-codes/json/"
    response = requests.get(url, headers=_auth_headers(), params=params, timeout=15)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=response.text or "Delhivery error")
    return response.json()


@router.get("/rate")
async def get_rate(request: Request):
    if not settings.delhivery_invoice_path:
        raise HTTPException(status_code=500, detail="Delhivery invoice path is not configured")
    params = dict(request.query_params)
    if not params:
        raise HTTPException(status_code=400, detail="Query params are required")
    url = f"{_base_url()}{settings.delhivery_invoice_path}"
    response = requests.get(url, headers=_auth_headers(), params=params, timeout=15)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=response.text or "Delhivery error")
    return response.json()


@router.get("/waybill/bulk", dependencies=[Depends(get_current_user)])
async def fetch_bulk_waybill(count: int = 1):
    if count < 1:
        raise HTTPException(status_code=400, detail="Count must be at least 1")
    url = f"{_base_url()}/waybill/api/bulk/json/"
    params = {
        "token": settings.delhivery_api_token,
        "count": count,
    }
    response = requests.get(url, params=params, timeout=15)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=response.text or "Delhivery error")
    return response.json()


@router.post("/order", dependencies=[Depends(get_current_user)])
async def create_order(payload: DelhiveryOrderPayload):
    url = f"{_base_url()}/api/cmu/create.json"
    data = {
        "format": "json",
        "data": json.dumps(payload.data),
    }
    response = requests.post(url, headers=_auth_headers(), data=data, timeout=30)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=response.text or "Delhivery error")
    return response.json()


@router.get("/label", dependencies=[Depends(get_current_user)])
async def get_packing_slip(wbns: str):
    if not wbns:
        raise HTTPException(status_code=400, detail="wbns is required")
    url = f"{_base_url()}/api/p/packing_slip"
    response = requests.get(url, headers=_auth_headers(), params={"wbns": wbns}, timeout=15)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=response.text or "Delhivery error")
    return response.json()


@router.post("/pickup", dependencies=[Depends(get_current_user)])
async def create_pickup(payload: DelhiveryPickupRequest):
    url = f"{_base_url()}/fm/request/new/"
    data = {
        "pickup_date": payload.pickup_date.strftime("%Y-%m-%d"),
        "pickup_time": payload.pickup_time,
        "pickup_location": payload.pickup_location,
        "expected_package_count": payload.expected_package_count,
    }
    response = requests.post(url, headers=_auth_headers(), data=data, timeout=15)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=response.text or "Delhivery error")
    return response.json()


@router.get("/track")
async def track_order(request: Request):
    params = dict(request.query_params)
    if not params:
        raise HTTPException(status_code=400, detail="Query params are required")
    url = f"{_base_url()}/api/v1/packages/json/"
    response = requests.get(url, headers=_auth_headers(), params=params, timeout=15)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=response.text or "Delhivery error")
    return response.json()
