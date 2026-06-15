from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime, timezone
from app.dependencies import get_supabase, get_current_user

router = APIRouter()


class VitalLogCreate(BaseModel):
    logged_at: Optional[str] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    blood_glucose: Optional[float] = None  # mmol/L
    spo2: Optional[float] = None           # percentage
    heart_rate: Optional[int] = None
    notes: Optional[str] = None


@router.get("")
def get_vital_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    res = (
        supabase.table("vital_logs")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("logged_at", desc=True)
        .limit(limit)
        .execute()
    )
    return res.data or []


@router.get("/latest")
def get_latest_vitals(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    res = (
        supabase.table("vital_logs")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("logged_at", desc=True)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


@router.post("")
def log_vitals(
    body: VitalLogCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    vital_fields = ("bp_systolic", "bp_diastolic", "blood_glucose", "spo2", "heart_rate")
    if not any(k in data for k in vital_fields):
        raise HTTPException(status_code=400, detail="At least one vital sign is required")

    data["user_id"] = current_user["id"]
    if "logged_at" not in data:
        data["logged_at"] = datetime.now(timezone.utc).isoformat()

    res = supabase.table("vital_logs").insert(data).execute()
    return res.data[0] if res.data else data


@router.delete("/{log_id}")
def delete_vital_log(
    log_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    existing = (
        supabase.table("vital_logs")
        .select("id")
        .eq("id", log_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Log not found")
    supabase.table("vital_logs").delete().eq("id", log_id).execute()
    return {"detail": "Deleted"}
