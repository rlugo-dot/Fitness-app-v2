from fastapi import APIRouter, Query, Depends, HTTPException
from pydantic import BaseModel
from typing import Any
from app.data.foods import search_foods, get_food_by_id, CATEGORIES
from app.dependencies import get_supabase, get_current_user

router = APIRouter()


class CustomFoodRequest(BaseModel):
    name: str
    category: str = "My Foods"
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    default_serving: int = 100
    serving_unit: str = "g"


def _row_to_food(row: dict) -> dict:
    return {
        "id": f"custom_{row['id']}",
        "name": row["name"],
        "category": row.get("category", "My Foods"),
        "calories": float(row["calories"]),
        "protein_g": float(row["protein_g"]),
        "carbs_g": float(row["carbs_g"]),
        "fat_g": float(row["fat_g"]),
        "fiber_g": float(row["fiber_g"]),
        "default_serving": int(row["default_serving"]),
        "serving_unit": row.get("serving_unit", "g"),
        "is_custom": True,
    }


@router.get("")
def list_foods(
    q: str = Query(default="", description="Search query"),
    category: str = Query(default="", description="Filter by category"),
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    static = search_foods(query=q, category=category)

    query = supabase.table("custom_foods").select("*").eq("user_id", current_user["id"])
    if q:
        query = query.ilike("name", f"%{q}%")
    if category and category != "My Foods":
        query = query.eq("category", category)
    custom_rows = query.order("created_at", desc=True).execute().data or []
    custom = [_row_to_food(r) for r in custom_rows]

    return custom + static


@router.get("/categories")
def list_categories(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    has_custom = supabase.table("custom_foods").select("id").eq("user_id", current_user["id"]).limit(1).execute().data
    if has_custom:
        return ["My Foods"] + CATEGORIES
    return CATEGORIES


@router.post("/custom")
def create_custom_food(
    body: CustomFoodRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    row = supabase.table("custom_foods").insert({
        "user_id": current_user["id"],
        "name": body.name,
        "category": body.category,
        "calories": body.calories,
        "protein_g": body.protein_g,
        "carbs_g": body.carbs_g,
        "fat_g": body.fat_g,
        "fiber_g": body.fiber_g,
        "default_serving": body.default_serving,
        "serving_unit": body.serving_unit,
    }).execute().data[0]
    return _row_to_food(row)


@router.delete("/custom/{food_id}")
def delete_custom_food(
    food_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = supabase.table("custom_foods").delete().eq("id", food_id).eq("user_id", current_user["id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@router.get("/{food_id}")
def get_food(food_id: str):
    food = get_food_by_id(food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return food
