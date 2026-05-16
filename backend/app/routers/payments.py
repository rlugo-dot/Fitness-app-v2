from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Any
from datetime import datetime, timezone, timedelta
import httpx
import base64
import hmac
import hashlib
from app.dependencies import get_supabase, get_current_user
from app.config import (
    PAYMONGO_SECRET_KEY, PAYMONGO_WEBHOOK_SECRET,
    APP_URL, SUBSCRIPTION_PRICE_PHP, SUBSCRIPTION_DAYS,
)

router = APIRouter()

PAYMONGO_BASE = "https://api.paymongo.com/v1"


def _auth_header() -> str:
    return "Basic " + base64.b64encode(f"{PAYMONGO_SECRET_KEY}:".encode()).decode()


def _sub_row(user_id: str, supabase: Any):
    res = supabase.table("subscriptions").select("*").eq("user_id", user_id).execute()
    return res.data[0] if res.data else None


def _is_active(sub: dict | None) -> bool:
    if not sub or sub["status"] != "active":
        return False
    if not sub.get("expires_at"):
        return False
    exp = datetime.fromisoformat(sub["expires_at"].replace("Z", "+00:00"))
    return exp > datetime.now(timezone.utc)


# ── GET /subscription ──────────────────────────────────────────────────────────

@router.get("/subscription")
def get_subscription(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    sub = _sub_row(current_user["id"], supabase)
    if not sub:
        return {"status": "inactive", "expires_at": None, "is_active": False}

    if sub["status"] == "active" and not _is_active(sub):
        supabase.table("subscriptions").update({"status": "expired"}) \
            .eq("user_id", current_user["id"]).execute()
        sub["status"] = "expired"

    return {
        "status": sub["status"],
        "expires_at": sub.get("expires_at"),
        "is_active": _is_active(sub),
    }


# ── POST /checkout ─────────────────────────────────────────────────────────────

@router.post("/checkout")
def create_checkout(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    sub = _sub_row(current_user["id"], supabase)
    if _is_active(sub):
        raise HTTPException(status_code=400, detail="You already have an active subscription.")

    if not PAYMONGO_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Payment service not configured yet.")

    success_url = f"{APP_URL}/subscription/success"
    cancel_url  = f"{APP_URL}/professionals"

    try:
        resp = httpx.post(
            f"{PAYMONGO_BASE}/checkout_sessions",
            headers={"Authorization": _auth_header(), "Content-Type": "application/json"},
            json={
                "data": {
                    "attributes": {
                        "send_email_receipt": True,
                        "show_description": True,
                        "show_line_items": True,
                        "cancel_url": cancel_url,
                        "success_url": success_url,
                        "description": "Phitness Pro — 30-day unlimited access to health professionals",
                        "line_items": [{
                            "currency": "PHP",
                            "amount": SUBSCRIPTION_PRICE_PHP * 100,  # centavos
                            "description": "Unlimited bookings with any Phitness professional",
                            "name": "Phitness Pro (30 days)",
                            "quantity": 1,
                        }],
                        "payment_method_types": ["card", "gcash", "maya", "grab_pay", "dob"],
                        "metadata": {"user_id": current_user["id"]},
                    }
                }
            },
            timeout=10,
        )
        data = resp.json()
        if "errors" in data:
            raise HTTPException(status_code=400, detail=data["errors"][0].get("detail", "Payment error"))

        session_id   = data["data"]["id"]
        checkout_url = data["data"]["attributes"]["checkout_url"]

        supabase.table("subscriptions").upsert({
            "user_id": current_user["id"],
            "status": "pending",
            "paymongo_session_id": session_id,
        }, on_conflict="user_id").execute()

        return {"checkout_url": checkout_url}

    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not reach payment service.")


# ── POST /webhook ──────────────────────────────────────────────────────────────

@router.post("/webhook")
async def paymongo_webhook(request: Request, supabase: Any = Depends(get_supabase)):
    raw_body = await request.body()

    # Verify signature if secret is configured
    if PAYMONGO_WEBHOOK_SECRET:
        sig_header = request.headers.get("paymongo-signature", "")
        parts = {p.split("=")[0]: p.split("=")[1] for p in sig_header.split(",") if "=" in p}
        ts  = parts.get("t", "")
        sig = parts.get("te", "") or parts.get("li", "")
        expected = hmac.new(
            PAYMONGO_WEBHOOK_SECRET.encode(),
            f"{ts}.{raw_body.decode()}".encode(),
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, sig):
            raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        body = await request.json() if not raw_body else __import__("json").loads(raw_body)
        event_type = body.get("data", {}).get("attributes", {}).get("type", "")

        if event_type == "checkout_session.payment.paid":
            attrs    = body["data"]["attributes"]["data"]["attributes"]
            user_id  = attrs.get("metadata", {}).get("user_id")
            if not user_id:
                return {"status": "ok"}

            now        = datetime.now(timezone.utc)
            expires_at = now + timedelta(days=SUBSCRIPTION_DAYS)

            supabase.table("subscriptions").upsert({
                "user_id":   user_id,
                "status":    "active",
                "started_at": now.isoformat(),
                "expires_at": expires_at.isoformat(),
            }, on_conflict="user_id").execute()

    except Exception:
        pass  # Always return 200 so PayMongo doesn't retry indefinitely

    return {"status": "ok"}
