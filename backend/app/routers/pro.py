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


class UpdateClientProfile(BaseModel):
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    age: Optional[int] = None
    daily_calorie_goal: Optional[int] = None
    goal: Optional[str] = None


class NoteCreate(BaseModel):
    content: str


class LogFoodOnBehalf(BaseModel):
    log_date: str
    meal_type: str
    food_name: str
    quantity: float = 1
    calories: float
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0


class LogWorkoutOnBehalf(BaseModel):
    log_date: str
    activity: str
    duration_min: int
    calories_burned: Optional[float] = None
    notes: Optional[str] = None


class LogWeightOnBehalf(BaseModel):
    weight_kg: float
    body_fat_pct: Optional[float] = None
    notes: Optional[str] = None


def _verify_client(supabase: Any, pro_id: str, user_id: str):
    booking = (
        supabase.table("booking_requests")
        .select("id")
        .eq("professional_id", pro_id)
        .eq("user_id", user_id)
        .eq("status", "confirmed")
        .execute()
    )
    if not booking.data:
        raise HTTPException(status_code=403, detail="No confirmed booking with this client")


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
    if status not in ("confirmed", "cancelled", "pending_client"):
        raise HTTPException(status_code=400, detail="Invalid status")

    update_data: dict = {"status": status}

    if status == "pending_client":
        proposed_date = body.get("proposed_date")
        if not proposed_date:
            raise HTTPException(status_code=400, detail="proposed_date is required when counter-proposing")
        update_data["proposed_date"] = proposed_date

    supabase.table("booking_requests").update(update_data).eq("id", booking_id).execute()
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

    # All unique client IDs across all bookings (superset of confirmed)
    all_user_ids = list({b["user_id"] for b in bookings if b.get("user_id")})
    confirmed_user_ids = list({b["user_id"] for b in confirmed if b.get("user_id")})

    # Single profiles query covers both confirmed clients and all booking cards
    names: dict = {}
    if all_user_ids:
        p_res = (
            supabase.table("profiles")
            .select("id, full_name")
            .in_("id", all_user_ids)
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

    # Attach names to all bookings for the requests list (reuse the same dict)
    for b in bookings:
        uid = b.get("user_id")
        b["client"] = {"full_name": names.get(uid)} if uid else None

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

    _verify_client(supabase, pro_id, user_id)

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


# ── PATCH /pro/clients/{user_id}/profile ──────────────────────────────────────

@router.patch("/clients/{user_id}/profile")
def update_client_profile(
    user_id: str,
    body: UpdateClientProfile,
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro_id = ctx["pro"]["id"]
    _verify_client(supabase, pro_id, user_id)

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")

    res = supabase.table("profiles").update(updates).eq("id", user_id).execute()
    return res.data[0] if res.data else {}


# ── GET /pro/clients/{user_id}/notes ──────────────────────────────────────────

@router.get("/clients/{user_id}/notes")
def get_client_notes(
    user_id: str,
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro_id = ctx["pro"]["id"]
    _verify_client(supabase, pro_id, user_id)

    res = (
        supabase.table("professional_notes")
        .select("*")
        .eq("pro_id", pro_id)
        .eq("client_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


# ── POST /pro/clients/{user_id}/notes ─────────────────────────────────────────

@router.post("/clients/{user_id}/notes")
def create_client_note(
    user_id: str,
    body: NoteCreate,
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro_id = ctx["pro"]["id"]
    _verify_client(supabase, pro_id, user_id)

    res = supabase.table("professional_notes").insert({
        "pro_id": pro_id,
        "client_id": user_id,
        "content": body.content,
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create note")
    return res.data[0]


# ── PATCH /pro/clients/{user_id}/notes/{note_id} ──────────────────────────────

@router.patch("/clients/{user_id}/notes/{note_id}")
def update_client_note(
    user_id: str,
    note_id: str,
    body: NoteCreate,
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro_id = ctx["pro"]["id"]
    _verify_client(supabase, pro_id, user_id)

    now = datetime.now(timezone.utc).isoformat()
    res = (
        supabase.table("professional_notes")
        .update({"content": body.content, "updated_at": now})
        .eq("id", note_id)
        .eq("pro_id", pro_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Note not found")
    return res.data[0]


# ── DELETE /pro/clients/{user_id}/notes/{note_id} ─────────────────────────────

@router.delete("/clients/{user_id}/notes/{note_id}")
def delete_client_note(
    user_id: str,
    note_id: str,
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro_id = ctx["pro"]["id"]
    _verify_client(supabase, pro_id, user_id)

    supabase.table("professional_notes").delete().eq("id", note_id).eq("pro_id", pro_id).execute()
    return {"ok": True}


# ── POST /pro/clients/{user_id}/food ──────────────────────────────────────────

@router.post("/clients/{user_id}/food")
def log_food_on_behalf(
    user_id: str,
    body: LogFoodOnBehalf,
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro_id = ctx["pro"]["id"]
    _verify_client(supabase, pro_id, user_id)

    res = supabase.table("food_logs").insert({
        "user_id": user_id,
        "log_date": body.log_date,
        "meal_type": body.meal_type,
        "food_name": body.food_name,
        "quantity": body.quantity,
        "calories": body.calories,
        "protein_g": body.protein_g,
        "carbs_g": body.carbs_g,
        "fat_g": body.fat_g,
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to log food")
    return res.data[0]


# ── POST /pro/clients/{user_id}/workout ───────────────────────────────────────

@router.post("/clients/{user_id}/workout")
def log_workout_on_behalf(
    user_id: str,
    body: LogWorkoutOnBehalf,
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro_id = ctx["pro"]["id"]
    _verify_client(supabase, pro_id, user_id)

    insert_data: dict = {
        "user_id": user_id,
        "log_date": body.log_date,
        "activity": body.activity,
        "duration_min": body.duration_min,
    }
    if body.calories_burned is not None:
        insert_data["calories_burned"] = body.calories_burned
    if body.notes:
        insert_data["notes"] = body.notes

    res = supabase.table("workout_logs").insert(insert_data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to log workout")
    return res.data[0]


# ── POST /pro/clients/{user_id}/weight ────────────────────────────────────────

@router.post("/clients/{user_id}/weight")
def log_weight_on_behalf(
    user_id: str,
    body: LogWeightOnBehalf,
    ctx: dict = Depends(get_current_pro),
    supabase: Any = Depends(get_supabase),
):
    pro_id = ctx["pro"]["id"]
    _verify_client(supabase, pro_id, user_id)

    insert_data: dict = {
        "user_id": user_id,
        "weight_kg": body.weight_kg,
        "logged_at": datetime.now(timezone.utc).isoformat(),
    }
    if body.body_fat_pct is not None:
        insert_data["body_fat_pct"] = body.body_fat_pct
    if body.notes:
        insert_data["notes"] = body.notes

    res = supabase.table("weight_logs").insert(insert_data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to log weight")
    return res.data[0]
