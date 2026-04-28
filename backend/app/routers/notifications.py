import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any
from app.dependencies import get_supabase, get_current_user
from app.config import VAPID_PRIVATE_KEY, VAPID_EMAIL

router = APIRouter()


class PushSubscription(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


def _send_push(endpoint: str, p256dh: str, auth: str, payload: dict) -> bool:
    try:
        from pywebpush import webpush, WebPushException
        webpush(
            subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
            data=json.dumps(payload),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{VAPID_EMAIL}"},
        )
        return True
    except Exception:
        return False


@router.post("/subscribe")
def subscribe(
    sub: PushSubscription,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    supabase.table("push_subscriptions").upsert(
        {
            "user_id": current_user["id"],
            "endpoint": sub.endpoint,
            "p256dh": sub.p256dh,
            "auth": sub.auth,
        },
        on_conflict="user_id,endpoint",
    ).execute()
    return {"subscribed": True}


@router.delete("/unsubscribe")
def unsubscribe(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    supabase.table("push_subscriptions").delete().eq("user_id", current_user["id"]).execute()
    return {"unsubscribed": True}


@router.get("/status")
def status(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("push_subscriptions")
        .select("id")
        .eq("user_id", current_user["id"])
        .execute()
    )
    return {"subscribed": bool(result.data)}


@router.post("/test")
def send_test(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    if not VAPID_PRIVATE_KEY:
        raise HTTPException(status_code=503, detail="Push notifications not configured")
    result = (
        supabase.table("push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No subscription found")
    sub = result.data[0]
    _send_push(sub["endpoint"], sub["p256dh"], sub["auth"], {
        "title": "Nutrisyon 🌿",
        "body": "Push notifications are working!",
        "url": "/",
    })
    return {"sent": True}


@router.post("/send-reminders")
def send_reminders(
    supabase: Any = Depends(get_supabase),
):
    """Called by a cron job to send meal reminders."""
    if not VAPID_PRIVATE_KEY:
        raise HTTPException(status_code=503, detail="Push notifications not configured")

    from datetime import datetime
    import pytz

    ph = pytz.timezone("Asia/Manila")
    hour = datetime.now(ph).hour

    if 7 <= hour <= 9:
        payload = {"title": "Breakfast time! 🌅", "body": "Don't forget to log your breakfast in Nutrisyon.", "url": "/food-search?meal=breakfast", "tag": "meal-breakfast"}
    elif 11 <= hour <= 13:
        payload = {"title": "Lunchtime! ☀️", "body": "Have you logged your lunch yet?", "url": "/food-search?meal=lunch", "tag": "meal-lunch"}
    elif 17 <= hour <= 19:
        payload = {"title": "Dinner reminder! 🌙", "body": "Log your dinner to stay on track.", "url": "/food-search?meal=dinner", "tag": "meal-dinner"}
    elif hour == 21:
        payload = {"title": "Streak alert! 🔥", "body": "Don't break your streak — log something before midnight!", "url": "/", "tag": "streak"}
    else:
        return {"sent": 0, "reason": "Not a reminder hour"}

    subs = supabase.table("push_subscriptions").select("endpoint, p256dh, auth").execute()
    sent = 0
    for sub in (subs.data or []):
        if _send_push(sub["endpoint"], sub["p256dh"], sub["auth"], payload):
            sent += 1
    return {"sent": sent}
