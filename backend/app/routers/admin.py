from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from app.dependencies import get_supabase, get_current_user
from app.config import ADMIN_EMAIL

router = APIRouter()


def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stats")
def get_stats(_: dict = Depends(require_admin), supabase: Any = Depends(get_supabase)):
    profiles     = supabase.table("profiles").select("id", count="exact").execute()
    professionals = supabase.table("professionals").select("id", count="exact").execute()
    pending      = supabase.table("professional_applications").select("id", count="exact").eq("status", "pending").execute()
    bookings     = supabase.table("professional_bookings").select("id", count="exact").execute()
    food_logs    = supabase.table("food_logs").select("id", count="exact").execute()
    workout_logs = supabase.table("workout_logs").select("id", count="exact").execute()
    return {
        "total_users":           profiles.count or 0,
        "active_professionals":  professionals.count or 0,
        "pending_applications":  pending.count or 0,
        "total_bookings":        bookings.count or 0,
        "total_food_logs":       food_logs.count or 0,
        "total_workout_logs":    workout_logs.count or 0,
    }


@router.get("/users")
def get_all_users(_: dict = Depends(require_admin), supabase: Any = Depends(get_supabase)):
    return supabase.table("profiles").select("*").order("created_at", desc=True).execute().data or []


@router.get("/bookings")
def get_all_bookings(_: dict = Depends(require_admin), supabase: Any = Depends(get_supabase)):
    return (
        supabase.table("professional_bookings")
        .select("*, professional:professionals(name, title, avatar_emoji, avatar_color)")
        .order("created_at", desc=True)
        .execute().data or []
    )


@router.patch("/professionals/{pro_id}/toggle")
def toggle_professional(pro_id: str, _: dict = Depends(require_admin), supabase: Any = Depends(get_supabase)):
    res = supabase.table("professionals").select("is_available").eq("id", pro_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Professional not found")
    new_val = not res.data[0]["is_available"]
    supabase.table("professionals").update({"is_available": new_val}).eq("id", pro_id).execute()
    return {"is_available": new_val}


@router.delete("/professionals/{pro_id}")
def remove_professional(pro_id: str, _: dict = Depends(require_admin), supabase: Any = Depends(get_supabase)):
    supabase.table("professionals").delete().eq("id", pro_id).execute()
    return {"message": "Removed from directory"}
