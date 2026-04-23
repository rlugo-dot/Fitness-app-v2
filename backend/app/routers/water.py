from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Any
from app.dependencies import get_supabase, get_current_user

router = APIRouter()

GOAL = 8


class WaterUpdate(BaseModel):
    glasses: int
    log_date: str


@router.get("")
def get_water(
    log_date: str = Query(...),
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("water_logs")
        .select("glasses")
        .eq("user_id", current_user["id"])
        .eq("log_date", log_date)
        .execute()
    )
    glasses = result.data[0]["glasses"] if result.data else 0
    return {"glasses": glasses, "goal": GOAL}


@router.put("")
def update_water(
    req: WaterUpdate,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    glasses = max(0, min(req.glasses, 20))
    supabase.table("water_logs").upsert(
        {"user_id": current_user["id"], "glasses": glasses, "log_date": req.log_date},
        on_conflict="user_id,log_date",
    ).execute()
    return {"glasses": glasses, "goal": GOAL}
