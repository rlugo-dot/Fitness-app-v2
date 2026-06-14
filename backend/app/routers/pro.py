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
    session_type: Optional[str] = None


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
        .select("*")
        .eq("professional_id", pro_id)
        .order("created_at", desc=True)
        .execute()
    )
    rows = res.data or []

    # Fetch client names separately — no FK from booking_requests to profiles
    user_ids = list({r["user_id"] for r in rows if r.get("user_id")})
    names: dict = {}
    if user_ids:
        profiles_res = (
            supabase.table("profiles")
            .select("id, full_name")
            .in_("id", user_ids)
            .execute()
        )
        names = {p["id"]: p["full_name"] for p in (profiles_res.data or [])}

    for row in rows:
        uid = row.get("user_id")
        row["client"] = {"full_name": names.get(uid)} if uid else None

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


# ── GET /pro/dashboard ────────────────────────────────────────────────────────

@router.get("/dashboard")
def get_pro_dashboard(
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro = ctx["pro"]
    pro_id = pro["id"]
    rate = pro.get("rate_php") or 0

    # All bookings
    bookings_res = supabase.table("booking_requests").select("*").eq("professional_id", pro_id).execute()
    bookings = bookings_res.data or []

    confirmed = [b for b in bookings if b["status"] == "confirmed"]
    pending   = [b for b in bookings if b["status"] == "pending"]

    # Unique confirmed client IDs
    confirmed_user_ids = list({b["user_id"] for b in confirmed if b.get("user_id")})

    # Bulk-fetch client names
    names: dict = {}
    if confirmed_user_ids:
        p_res = (
            supabase.table("profiles")
            .select("id, full_name")
            .in_("id", confirmed_user_ids)
            .execute()
        )
        names = {p["id"]: p["full_name"] for p in (p_res.data or [])}

    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")

    client_summaries = []
    for uid in confirmed_user_ids:
        # Weekly calories
        food_res = (
            supabase.table("food_logs")
            .select("calories, log_date")
            .eq("user_id", uid)
            .gte("log_date", seven_days_ago)
            .execute()
        )
        by_day: dict = {}
        for row in (food_res.data or []):
            d = row["log_date"]
            by_day[d] = by_day.get(d, 0) + (row["calories"] or 0)
        avg_cal = round(sum(by_day.values()) / len(by_day)) if by_day else None

        # Weekly workouts
        wo_res = (
            supabase.table("workout_logs")
            .select("id, calories_burned")
            .eq("user_id", uid)
            .gte("log_date", seven_days_ago)
            .execute()
        )
        workouts = wo_res.data or []
        calories_burned = sum((w.get("calories_burned") or 0) for w in workouts)

        # Latest two weights for trend
        wt_res = (
            supabase.table("weight_logs")
            .select("weight_kg, logged_at")
            .eq("user_id", uid)
            .order("logged_at", desc=True)
            .limit(2)
            .execute()
        )
        weights = wt_res.data or []
        latest_weight = weights[0]["weight_kg"] if weights else None
        weight_change = (
            round(weights[0]["weight_kg"] - weights[1]["weight_kg"], 1)
            if len(weights) >= 2 else None
        )

        client_summaries.append({
            "user_id": uid,
            "name": names.get(uid, "Unknown"),
            "avg_calories_7d": avg_cal,
            "workouts_7d": len(workouts),
            "calories_burned_7d": round(calories_burned),
            "days_logged_7d": len(by_day),
            "latest_weight_kg": latest_weight,
            "weight_change_kg": weight_change,
        })

    # Attach client names to all bookings for the requests list
    all_user_ids = list({b["user_id"] for b in bookings if b.get("user_id")})
    all_names: dict = {}
    if all_user_ids:
        an_res = (
            supabase.table("profiles")
            .select("id, full_name")
            .in_("id", all_user_ids)
            .execute()
        )
        all_names = {p["id"]: p["full_name"] for p in (an_res.data or [])}

    for b in bookings:
        uid = b.get("user_id")
        b["client"] = {"full_name": all_names.get(uid)} if uid else None

    return {
        "revenue": {
            "earned": len(confirmed) * rate,
            "pending_amount": len(pending) * rate,
            "confirmed_sessions": len(confirmed),
            "pending_sessions": len(pending),
            "total_sessions": len(bookings),
            "rate_php": rate,
        },
        "clients": client_summaries,
        "bookings": bookings,
    }


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

    profile_res = supabase.table("profiles").select("*").eq("id", user_id).execute()
    food_res = (
        supabase.table("food_logs")
        .select("id, log_date, meal_type, quantity, food_name, calories, protein_g, carbs_g, fat_g")
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
