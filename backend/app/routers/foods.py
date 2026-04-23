from fastapi import APIRouter, Query
from app.data.foods import search_foods, get_food_by_id, CATEGORIES

router = APIRouter()


@router.get("")
def list_foods(
    q: str = Query(default="", description="Search query"),
    category: str = Query(default="", description="Filter by category"),
):
    return search_foods(query=q, category=category)


@router.get("/categories")
def list_categories():
    return CATEGORIES


@router.get("/{food_id}")
def get_food(food_id: str):
    food = get_food_by_id(food_id)
    if not food:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Food not found")
    return food
