from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from typing import Optional, Any
from app.dependencies import get_supabase, get_current_user
from app.limiter import limiter

router = APIRouter()

MET = {"weights": 3.5, "cardio": 7.0, "bjj_mma": 10.0, "other": 4.0}
LABELS = {"weights": "Weights", "cardio": "Cardio", "bjj_mma": "BJJ / MMA", "other": "Other"}


class Exercise(BaseModel):
    name: str
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight_kg: Optional[float] = None
    duration_min: Optional[int] = None
    distance_km: Optional[float] = None


class LogWorkoutRequest(BaseModel):
    workout_type: str
    name: str
    duration_min: int
    exercises: list[Exercise] = []
    log_date: str
    body_weight_kg: Optional[float] = None
    is_shared: bool = False
    caption: Optional[str] = None


@router.get("")
def get_workouts(
    log_date: str = Query(...),
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("workout_logs")
        .select("*")
        .eq("user_id", current_user["id"])
        .eq("log_date", log_date)
        .order("created_at")
        .execute()
    )
    return result.data or []


@router.post("")
@limiter.limit("20/15minutes")
def log_workout(
    request: Request,
    req: LogWorkoutRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    if req.workout_type not in MET:
        raise HTTPException(status_code=400, detail="Invalid workout_type")
    weight = req.body_weight_kg or 70.0
    calories = round(MET[req.workout_type] * weight * (req.duration_min / 60))
    record = {
        "user_id": current_user["id"],
        "workout_type": req.workout_type,
        "name": req.name or LABELS[req.workout_type],
        "duration_min": req.duration_min,
        "calories_burned": calories,
        "exercises": [e.model_dump(exclude_none=True) for e in req.exercises],
        "log_date": req.log_date,
        "is_shared": req.is_shared,
        "caption": req.caption,
    }
    result = supabase.table("workout_logs").insert(record).execute()
    return result.data[0]


@router.delete("/{workout_id}")
def delete_workout(
    workout_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    existing = (
        supabase.table("workout_logs")
        .select("id")
        .eq("id", workout_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Workout not found")
    supabase.table("workout_logs").delete().eq("id", workout_id).eq("user_id", current_user["id"]).execute()
    return {"detail": "Deleted"}


@router.get("/summary")
def get_workout_summary(
    log_date: str = Query(...),
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("workout_logs")
        .select("calories_burned, duration_min")
        .eq("user_id", current_user["id"])
        .eq("log_date", log_date)
        .execute()
    )
    rows = result.data or []
    return {
        "total_calories_burned": sum(r["calories_burned"] for r in rows),
        "total_duration_min": sum(r["duration_min"] for r in rows),
        "sessions": len(rows),
    }
