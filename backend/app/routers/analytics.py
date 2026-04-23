from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Any, Optional
from datetime import date, timedelta
from app.dependencies import get_supabase, get_current_user

router = APIRouter()


class DayStats(BaseModel):
    date: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    entries: int


class WorkoutDayStats(BaseModel):
    date: str
    sessions: int
    calories_burned: float
    duration_min: int


class AnalyticsOverview(BaseModel):
    days: list[DayStats]
    workout_days: list[WorkoutDayStats]
    streak: int
    longest_streak: int
    avg_calories: float
    avg_protein_g: float
    avg_carbs_g: float
    avg_fat_g: float
    total_workouts: int
    total_calories_burned: float
    calorie_goal: int


def _calc_streak(logged_dates: set[str]) -> tuple[int, int]:
    """Returns (current_streak, longest_streak)."""
    today = date.today()
    current = 0
    d = today
    while str(d) in logged_dates:
        current += 1
        d -= timedelta(days=1)

    # Longest: scan last 365 days
    longest = 0
    run = 0
    for i in range(365):
        check = str(today - timedelta(days=i))
        if check in logged_dates:
            run += 1
            longest = max(longest, run)
        else:
            run = 0

    return current, longest


@router.get("/overview", response_model=AnalyticsOverview)
def get_overview(
    days: int = Query(7, ge=7, le=90),
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    uid = current_user["id"]
    today = date.today()
    start = today - timedelta(days=days - 1)

    # Profile for calorie goal
    profile_res = (
        supabase.table("profiles")
        .select("daily_calorie_goal")
        .eq("id", uid)
        .single()
        .execute()
    )
    calorie_goal = (profile_res.data or {}).get("daily_calorie_goal", 2000)

    # Food logs in range
    food_res = (
        supabase.table("food_logs")
        .select("log_date, calories, protein_g, carbs_g, fat_g, fiber_g")
        .eq("user_id", uid)
        .gte("log_date", str(start))
        .lte("log_date", str(today))
        .execute()
    )
    food_rows = food_res.data or []

    # Aggregate by date
    day_map: dict[str, dict] = {}
    for row in food_rows:
        d = str(row["log_date"])
        if d not in day_map:
            day_map[d] = {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, "entries": 0}
        day_map[d]["calories"] += float(row["calories"])
        day_map[d]["protein_g"] += float(row["protein_g"])
        day_map[d]["carbs_g"] += float(row["carbs_g"])
        day_map[d]["fat_g"] += float(row["fat_g"])
        day_map[d]["fiber_g"] += float(row["fiber_g"])
        day_map[d]["entries"] += 1

    # Fill all days in range (including zeros)
    days_list: list[DayStats] = []
    for i in range(days):
        d = str(start + timedelta(days=i))
        stats = day_map.get(d, {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, "entries": 0})
        days_list.append(DayStats(date=d, **stats))

    # Workout logs in range
    workout_res = (
        supabase.table("workout_logs")
        .select("log_date, calories_burned, duration_min")
        .eq("user_id", uid)
        .gte("log_date", str(start))
        .lte("log_date", str(today))
        .execute()
    )
    workout_rows = workout_res.data or []

    workout_map: dict[str, dict] = {}
    for row in workout_rows:
        d = str(row["log_date"])
        if d not in workout_map:
            workout_map[d] = {"sessions": 0, "calories_burned": 0, "duration_min": 0}
        workout_map[d]["sessions"] += 1
        workout_map[d]["calories_burned"] += float(row["calories_burned"])
        workout_map[d]["duration_min"] += int(row["duration_min"])

    workout_days_list: list[WorkoutDayStats] = [
        WorkoutDayStats(date=d, **stats) for d, stats in workout_map.items()
    ]

    # Streak (use all-time food logs for accuracy)
    all_dates_res = (
        supabase.table("food_logs")
        .select("log_date")
        .eq("user_id", uid)
        .execute()
    )
    logged_dates = {str(r["log_date"]) for r in (all_dates_res.data or [])}
    streak, longest = _calc_streak(logged_dates)

    # Averages (only logged days)
    logged = [d for d in days_list if d.entries > 0]
    n = len(logged) or 1
    avg_cal = round(sum(d.calories for d in logged) / n, 1)
    avg_prot = round(sum(d.protein_g for d in logged) / n, 1)
    avg_carbs = round(sum(d.carbs_g for d in logged) / n, 1)
    avg_fat = round(sum(d.fat_g for d in logged) / n, 1)

    total_workouts = sum(w.sessions for w in workout_days_list)
    total_burned = sum(w.calories_burned for w in workout_days_list)

    return AnalyticsOverview(
        days=days_list,
        workout_days=workout_days_list,
        streak=streak,
        longest_streak=longest,
        avg_calories=avg_cal,
        avg_protein_g=avg_prot,
        avg_carbs_g=avg_carbs,
        avg_fat_g=avg_fat,
        total_workouts=total_workouts,
        total_calories_burned=total_burned,
        calorie_goal=calorie_goal,
    )
