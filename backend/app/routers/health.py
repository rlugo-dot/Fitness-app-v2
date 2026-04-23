from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any
from app.dependencies import get_supabase, get_current_user
from app.data.health import CONDITIONS, get_recommendations_for_conditions

router = APIRouter()


class UpdateConditionsRequest(BaseModel):
    conditions: list[str]


@router.get("/conditions")
def list_conditions():
    return CONDITIONS


@router.get("/my-conditions")
def get_my_conditions(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("profiles")
        .select("health_conditions")
        .eq("id", current_user["id"])
        .single()
        .execute()
    )
    return {"conditions": result.data.get("health_conditions", []) if result.data else []}


@router.put("/my-conditions")
def update_my_conditions(
    req: UpdateConditionsRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    valid_ids = {c["id"] for c in CONDITIONS}
    filtered = [c for c in req.conditions if c in valid_ids]
    supabase.table("profiles").update({"health_conditions": filtered}).eq("id", current_user["id"]).execute()
    return {"conditions": filtered}


@router.get("/recommendations")
def get_recommendations(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("profiles")
        .select("health_conditions")
        .eq("id", current_user["id"])
        .single()
        .execute()
    )
    conditions = result.data.get("health_conditions", []) if result.data else []
    return get_recommendations_for_conditions(conditions)
