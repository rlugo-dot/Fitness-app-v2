from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Any, Optional
from datetime import date as date_type
from app.dependencies import get_supabase, get_current_user
from app.limiter import limiter

router = APIRouter()


class WeightLogIn(BaseModel):
    weight_kg: float
    body_fat_pct: Optional[float] = None
    notes: Optional[str] = None
    logged_at: Optional[str] = None  # YYYY-MM-DD, defaults to today


class WeightLogOut(BaseModel):
    id: str
    weight_kg: float
    body_fat_pct: Optional[float]
    notes: Optional[str]
    logged_at: str
    created_at: str


@router.get("", response_model=list[WeightLogOut])
def list_weight_logs(
    limit: int = 30,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("weight_logs")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("logged_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


@router.post("", response_model=WeightLogOut)
@limiter.limit("5/15minutes")
def log_weight(
    request: Request,
    body: WeightLogIn,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    logged_at = body.logged_at or str(date_type.today())
    payload = {
        "user_id": current_user["id"],
        "weight_kg": body.weight_kg,
        "body_fat_pct": body.body_fat_pct,
        "notes": body.notes,
        "logged_at": logged_at,
    }
    result = supabase.table("weight_logs").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log weight")
    return result.data[0]


@router.delete("/{log_id}", status_code=204)
def delete_weight_log(
    log_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    supabase.table("weight_logs").delete().eq("id", log_id).eq("user_id", current_user["id"]).execute()
