import httpx
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
from app.dependencies import get_supabase, get_current_user

router = APIRouter()

OURA_BASE = "https://api.ouraring.com/v2/usercollection"


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ConnectRequest(BaseModel):
    provider: str          # 'oura' | 'whoop' | 'withings'
    access_token: str


class IntegrationStatus(BaseModel):
    provider: str
    connected: bool
    connected_at: Optional[str] = None


class OuraDaily(BaseModel):
    date: str
    readiness_score: Optional[int] = None
    sleep_score: Optional[int] = None
    activity_score: Optional[int] = None
    hrv_average: Optional[float] = None
    resting_heart_rate: Optional[int] = None
    calories_active: Optional[int] = None
    steps: Optional[int] = None
    sleep_hours: Optional[float] = None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_token(provider: str, user_id: str, supabase: Any) -> Optional[str]:
    result = (
        supabase.table("user_integrations")
        .select("access_token")
        .eq("user_id", user_id)
        .eq("provider", provider)
        .single()
        .execute()
    )
    if result.data:
        return result.data["access_token"]
    return None


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/status", response_model=list[IntegrationStatus])
def integration_status(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("user_integrations")
        .select("provider, connected_at")
        .eq("user_id", current_user["id"])
        .execute()
    )
    connected = {r["provider"]: r["connected_at"] for r in (result.data or [])}
    return [
        IntegrationStatus(
            provider=p,
            connected=p in connected,
            connected_at=connected.get(p),
        )
        for p in ["oura", "whoop", "withings"]
    ]


@router.post("/connect", response_model=IntegrationStatus)
def connect_integration(
    body: ConnectRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    if body.provider not in ("oura", "whoop", "withings"):
        raise HTTPException(status_code=400, detail="Unknown provider")

    # Validate Oura token by hitting a lightweight endpoint
    if body.provider == "oura":
        try:
            resp = httpx.get(
                f"{OURA_BASE}/personal_info",
                headers={"Authorization": f"Bearer {body.access_token}"},
                timeout=8,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid Oura token. Check your Personal Access Token.")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Could not reach Oura API")

    supabase.table("user_integrations").upsert(
        {
            "user_id": current_user["id"],
            "provider": body.provider,
            "access_token": body.access_token,
        },
        on_conflict="user_id,provider",
    ).execute()

    result = (
        supabase.table("user_integrations")
        .select("connected_at")
        .eq("user_id", current_user["id"])
        .eq("provider", body.provider)
        .single()
        .execute()
    )
    return IntegrationStatus(
        provider=body.provider,
        connected=True,
        connected_at=result.data["connected_at"] if result.data else None,
    )


@router.delete("/{provider}", status_code=204)
def disconnect_integration(
    provider: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    supabase.table("user_integrations").delete().eq("user_id", current_user["id"]).eq("provider", provider).execute()


@router.get("/oura/today", response_model=OuraDaily)
def oura_today(
    for_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    token = _get_token("oura", current_user["id"], supabase)
    if not token:
        raise HTTPException(status_code=404, detail="Oura not connected")

    target = for_date or str(date.today())
    headers = {"Authorization": f"Bearer {token}"}

    def fetch(endpoint: str) -> dict:
        try:
            r = httpx.get(
                f"{OURA_BASE}/{endpoint}",
                params={"start_date": target, "end_date": target},
                headers=headers,
                timeout=10,
            )
            if r.status_code == 200:
                items = r.json().get("data", [])
                return items[0] if items else {}
        except httpx.RequestError:
            pass
        return {}

    readiness = fetch("daily_readiness")
    sleep = fetch("daily_sleep")
    activity = fetch("daily_activity")

    # HRV & RHR from sleep detail
    hrv = None
    rhr = None
    sleep_hours = None
    if sleep:
        hrv = sleep.get("average_hrv")
        rhr = sleep.get("lowest_heart_rate")
        total_sec = sleep.get("total_sleep_duration")
        if total_sec:
            sleep_hours = round(total_sec / 3600, 1)

    return OuraDaily(
        date=target,
        readiness_score=readiness.get("score"),
        sleep_score=sleep.get("score"),
        activity_score=activity.get("score"),
        hrv_average=hrv,
        resting_heart_rate=rhr,
        calories_active=activity.get("active_calories"),
        steps=activity.get("steps"),
        sleep_hours=sleep_hours,
    )
