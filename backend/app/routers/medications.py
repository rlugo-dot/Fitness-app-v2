from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime, timezone, date
from app.dependencies import get_supabase, get_current_user

router = APIRouter()

VALID_FREQUENCIES = ("once_daily", "twice_daily", "three_times_daily", "as_needed", "weekly")
DOSES_PER_FREQ = {"once_daily": 1, "twice_daily": 2, "three_times_daily": 3, "as_needed": 0, "weekly": 1}


class MedicationCreate(BaseModel):
    name: str
    dosage: Optional[str] = None
    frequency: str = "once_daily"
    notes: Optional[str] = None


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    notes: Optional[str] = None
    active: Optional[bool] = None


@router.get("")
def get_medications(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    res = (
        supabase.table("medications")
        .select("*")
        .eq("user_id", current_user["id"])
        .eq("active", True)
        .order("created_at")
        .execute()
    )
    meds = res.data or []

    if not meds:
        return meds

    today_start = f"{date.today().isoformat()}T00:00:00+00:00"
    today_end = f"{date.today().isoformat()}T23:59:59+00:00"
    med_ids = [m["id"] for m in meds]

    logs_res = (
        supabase.table("medication_logs")
        .select("medication_id")
        .eq("user_id", current_user["id"])
        .gte("taken_at", today_start)
        .lte("taken_at", today_end)
        .in_("medication_id", med_ids)
        .execute()
    )
    taken_counts: dict = {}
    for log in (logs_res.data or []):
        mid = log["medication_id"]
        taken_counts[mid] = taken_counts.get(mid, 0) + 1

    for m in meds:
        m["taken_today"] = taken_counts.get(m["id"], 0)
        m["doses_needed"] = DOSES_PER_FREQ.get(m["frequency"], 1)

    return meds


@router.post("")
def add_medication(
    body: MedicationCreate,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    if body.frequency not in VALID_FREQUENCIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid frequency. Use: {', '.join(VALID_FREQUENCIES)}"
        )
    res = supabase.table("medications").insert({
        "user_id": current_user["id"],
        "name": body.name.strip(),
        "dosage": body.dosage,
        "frequency": body.frequency,
        "notes": body.notes,
    }).execute()
    med = res.data[0] if res.data else {}
    med["taken_today"] = 0
    med["doses_needed"] = DOSES_PER_FREQ.get(body.frequency, 1)
    return med


@router.patch("/{med_id}")
def update_medication(
    med_id: str,
    body: MedicationUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    res = (
        supabase.table("medications")
        .update(updates)
        .eq("id", med_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    return res.data[0] if res.data else {}


@router.delete("/{med_id}")
def delete_medication(
    med_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    supabase.table("medications").update({"active": False}).eq("id", med_id).eq("user_id", current_user["id"]).execute()
    return {"detail": "Removed"}


@router.post("/{med_id}/taken")
def log_dose(
    med_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    existing = (
        supabase.table("medications")
        .select("id")
        .eq("id", med_id)
        .eq("user_id", current_user["id"])
        .eq("active", True)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Medication not found")

    res = supabase.table("medication_logs").insert({
        "medication_id": med_id,
        "user_id": current_user["id"],
        "taken_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    return res.data[0] if res.data else {}
