from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Any
from app.dependencies import get_supabase, get_current_user
from app.data.foods import get_food_by_id

router = APIRouter()


class LogFoodRequest(BaseModel):
    food_id: str
    meal_type: str
    quantity: float
    log_date: str
    # Optional override fields for AI scan / recommendation entries
    food_name: str | None = None
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    fiber_g: float | None = None


@router.get("")
def get_meals(
    log_date: str = Query(...),
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("food_logs")
        .select("*")
        .eq("user_id", current_user["id"])
        .eq("log_date", log_date)
        .order("created_at")
        .execute()
    )
    return result.data or []


@router.post("")
def log_food(
    req: LogFoodRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    if req.meal_type not in ("breakfast", "lunch", "dinner", "snack"):
        raise HTTPException(status_code=400, detail="Invalid meal_type")

    # Custom entry (AI scan, recommendation) — macros provided directly
    is_custom = req.food_id.startswith("ai_scan_") or req.food_id.startswith("rec_")
    if is_custom:
        record = {
            "user_id": current_user["id"],
            "food_id": req.food_id,
            "food_name": req.food_name or req.food_id,
            "meal_type": req.meal_type,
            "quantity": req.quantity,
            "calories": round(req.calories or 0, 1),
            "protein_g": round(req.protein_g or 0, 1),
            "carbs_g": round(req.carbs_g or 0, 1),
            "fat_g": round(req.fat_g or 0, 1),
            "fiber_g": round(req.fiber_g or 0, 1),
            "log_date": req.log_date,
        }
    else:
        food = get_food_by_id(req.food_id)
        if not food:
            raise HTTPException(status_code=404, detail="Food not found")
        scale = req.quantity
        record = {
            "user_id": current_user["id"],
            "food_id": req.food_id,
            "food_name": food["name"],
            "meal_type": req.meal_type,
            "quantity": req.quantity,
            "calories": round(food["calories"] * food["default_serving"] / 100 * scale, 1),
            "protein_g": round(food["protein_g"] * food["default_serving"] / 100 * scale, 1),
            "carbs_g": round(food["carbs_g"] * food["default_serving"] / 100 * scale, 1),
            "fat_g": round(food["fat_g"] * food["default_serving"] / 100 * scale, 1),
            "fiber_g": round(food["fiber_g"] * food["default_serving"] / 100 * scale, 1),
            "log_date": req.log_date,
        }

    result = supabase.table("food_logs").insert(record).execute()
    return result.data[0]


@router.delete("/{log_id}")
def delete_meal_log(
    log_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    existing = (
        supabase.table("food_logs")
        .select("id")
        .eq("id", log_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Log entry not found")
    supabase.table("food_logs").delete().eq("id", log_id).execute()
    return {"detail": "Deleted"}


@router.get("/summary")
def get_daily_summary(
    log_date: str = Query(...),
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("food_logs")
        .select("calories, protein_g, carbs_g, fat_g, fiber_g")
        .eq("user_id", current_user["id"])
        .eq("log_date", log_date)
        .execute()
    )
    rows = result.data or []
    return {
        "calories": round(sum(r["calories"] for r in rows), 1),
        "protein_g": round(sum(r["protein_g"] for r in rows), 1),
        "carbs_g": round(sum(r["carbs_g"] for r in rows), 1),
        "fat_g": round(sum(r["fat_g"] for r in rows), 1),
        "fiber_g": round(sum(r["fiber_g"] for r in rows), 1),
        "entries": len(rows),
    }
