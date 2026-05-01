from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from app.dependencies import get_supabase, get_current_user

router = APIRouter()


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    goal: Optional[str] = None
    daily_calorie_goal: Optional[int] = None


@router.get("/me")
def get_profile(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = supabase.table("profiles").select("*").eq("id", current_user["id"]).execute()
    if result.data:
        return result.data[0]
    # Auto-create profile for new users who skipped client-side creation
    full_name = (current_user.get("user_metadata") or {}).get("full_name") or None
    insert = supabase.table("profiles").insert({
        "id": current_user["id"],
        "full_name": full_name,
        "daily_calorie_goal": 2000,
    }).execute()
    return insert.data[0] if insert.data else {"id": current_user["id"], "full_name": full_name}


@router.patch("/me")
def update_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = supabase.table("profiles").update(updates).eq("id", current_user["id"]).execute()
    return result.data[0] if result.data else {}
