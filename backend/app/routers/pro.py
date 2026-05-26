from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime, timezone, timedelta
from app.dependencies import get_supabase, get_current_user

router = APIRouter()


def get_current_pro(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    email = current_user.get("email", "").lower()
    res = supabase.table("professionals").select("*").eq("email", email).execute()
    if not res.data:
        raise HTTPException(status_code=403, detail="Not a registered professional")
    return {"user": current_user, "pro": res.data[0]}


class UpdateProfile(BaseModel):
    bio: Optional[str] = None
    rate_php: Optional[int] = None
    location: Optional[str] = None
    specialties: Optional[list[str]] = None


# ── GET /pro/me ────────────────────────────────────────────────────────────────

@router.get("/me")
def get_pro_me(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    email = current_user.get("email", "").lower()
    res = supabase.table("professionals").select("*").eq("email", email).execute()
    return res.data[0] if res.data else None


# ── GET /pro/bookings ──────────────────────────────────────────────────────────

@router.get("/bookings")
def get_pro_bookings(
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro_id = ctx["pro"]["id"]
    res = (
        supabase.table("booking_requests")
        .select("*, profiles(full_name)")
        .eq("professional_id", pro_id)
        .order("created_at", desc=True)
        .execute()
    )
    rows = []
    for row in (res.data or []):
        row["client"] = row.pop("profiles", None)
        rows.append(row)
    return rows


# ── PATCH /pro/bookings/{id} ───────────────────────────────────────────────────

@router.patch("/bookings/{booking_id}")
def update_booking(
    booking_id: str,
    body: dict,
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro_id = ctx["pro"]["id"]
    exists = (
        supabase.table("booking_requests")
        .select("id")
        .eq("id", booking_id)
        .eq("professional_id", pro_id)
        .execute()
    )
    if not exists.data:
        raise HTTPException(status_code=404, detail="Booking not found")

    status = body.get("status")
    if status not in ("confirmed", "cancelled"):
        raise HTTPException(status_code=400, detail="Invalid status")

    supabase.table("booking_requests").update({"status": status}).eq("id", booking_id).execute()
    return {"status": status}


# ── PATCH /pro/availability ────────────────────────────────────────────────────

@router.patch("/availability")
def toggle_availability(
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro = ctx["pro"]
    new_val = not pro["is_available"]
    supabase.table("professionals").update({"is_available": new_val}).eq("id", pro["id"]).execute()
    return {"is_available": new_val}


# ── PATCH /pro/profile ─────────────────────────────────────────────────────────

@router.patch("/profile")
def update_pro_profile(
    body: UpdateProfile,
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    res = supabase.table("professionals").update(updates).eq("id", ctx["pro"]["id"]).execute()
    return res.data[0] if res.data else {}


# ── GET /pro/clients/{user_id} ─────────────────────────────────────────────────

@router.get("/clients/{user_id}")
def get_client_data(
    user_id: str,
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro_id = ctx["pro"]["id"]

    # Verify booking relationship
    booking = (
        supabase.table("booking_requests")
        .select("id")
        .eq("professional_id", pro_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not booking.data:
        raise HTTPException(status_code=403, detail="No booking with this client")

    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")

    profile_res = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
    food_res = (
        supabase.table("food_logs")
        .select("*, foods(name, calories, protein_g, carbs_g, fat_g)")
        .eq("user_id", user_id)
        .gte("log_date", seven_days_ago)
        .order("log_date", desc=True)
        .limit(60)
        .execute()
    )
    workout_res = (
        supabase.table("workout_logs")
        .select("*")
        .eq("user_id", user_id)
        .gte("log_date", seven_days_ago)
        .order("log_date", desc=True)
        .execute()
    )
    weight_res = (
        supabase.table("weight_logs")
        .select("*")
        .eq("user_id", user_id)
        .order("logged_at", desc=True)
        .limit(10)
        .execute()
    )

    return {
        "profile": profile_res.data[0] if profile_res.data else None,
        "food_logs": food_res.data or [],
        "workout_logs": workout_res.data or [],
        "weight_logs": weight_res.data or [],
    }
