from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime, timezone
from app.dependencies import get_supabase, get_current_user
from app.config import ADMIN_EMAIL, MONTHLY_FEE_PHP

router = APIRouter()


class ApplicationRequest(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    title: str
    specialties: list[str] = []
    bio: str
    location: str
    years_exp: int
    rate_php: int
    avatar_emoji: str = "👨‍⚕️"
    avatar_color: str = "#16a34a"


class ReviewRequest(BaseModel):
    notes: Optional[str] = None


def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("email") != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.post("", status_code=201)
def submit_application(
    req: ApplicationRequest,
    supabase: Any = Depends(get_supabase),
):
    email = req.email.strip().lower()
    existing = (
        supabase.table("professional_applications")
        .select("id, status")
        .eq("email", email)
        .execute()
    )
    if existing.data:
        s = existing.data[0]["status"]
        if s == "rejected":
            raise HTTPException(status_code=409, detail="This email was not approved. Contact us for more info.")
        raise HTTPException(status_code=409, detail="An application with this email already exists.")

    supabase.table("professional_applications").insert({
        "name": req.name.strip(),
        "email": email,
        "phone": req.phone.strip() if req.phone else None,
        "title": req.title.strip(),
        "specialties": req.specialties,
        "bio": req.bio.strip(),
        "location": req.location.strip(),
        "years_exp": max(0, req.years_exp),
        "rate_php": max(0, req.rate_php),
        "avatar_emoji": req.avatar_emoji,
        "avatar_color": req.avatar_color,
        "status": "pending",
        "payment_status": "unpaid",
    }).execute()

    return {"message": "Application submitted. We'll review it within 48 hours."}


@router.get("/fee")
def get_fee():
    return {"monthly_fee_php": MONTHLY_FEE_PHP}


@router.get("")
def list_applications(
    status: Optional[str] = Query(None),
    _: dict = Depends(require_admin),
    supabase: Any = Depends(get_supabase),
):
    query = (
        supabase.table("professional_applications")
        .select("*")
        .order("applied_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    return query.execute().data or []


@router.patch("/{app_id}/approve")
def approve_application(
    app_id: str,
    body: ReviewRequest = ReviewRequest(),
    _: dict = Depends(require_admin),
    supabase: Any = Depends(get_supabase),
):
    app_res = supabase.table("professional_applications").select("id, status").eq("id", app_id).execute()
    if not app_res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    if app_res.data[0]["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending applications can be approved")

    supabase.table("professional_applications").update({
        "status": "approved",
        "reviewer_notes": body.notes,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", app_id).execute()

    return {"message": "Approved. Send them the payment link to activate."}


@router.patch("/{app_id}/reject")
def reject_application(
    app_id: str,
    body: ReviewRequest = ReviewRequest(),
    _: dict = Depends(require_admin),
    supabase: Any = Depends(get_supabase),
):
    app_res = supabase.table("professional_applications").select("id").eq("id", app_id).execute()
    if not app_res.data:
        raise HTTPException(status_code=404, detail="Application not found")

    supabase.table("professional_applications").update({
        "status": "rejected",
        "reviewer_notes": body.notes,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", app_id).execute()

    return {"message": "Application rejected."}


@router.patch("/{app_id}/activate")
def activate_professional(
    app_id: str,
    _: dict = Depends(require_admin),
    supabase: Any = Depends(get_supabase),
):
    app_res = supabase.table("professional_applications").select("*").eq("id", app_id).execute()
    if not app_res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    app = app_res.data[0]

    if app["status"] != "approved":
        raise HTTPException(status_code=400, detail="Approve the application before activating")

    supabase.table("professionals").insert({
        "name": app["name"],
        "title": app["title"],
        "specialties": app["specialties"],
        "bio": app["bio"],
        "location": app["location"],
        "years_exp": app["years_exp"],
        "rate_php": app["rate_php"],
        "avatar_emoji": app["avatar_emoji"],
        "avatar_color": app["avatar_color"],
        "is_available": True,
    }).execute()

    supabase.table("professional_applications").update({
        "status": "active",
        "payment_status": "paid",
    }).eq("id", app_id).execute()

    return {"message": f"{app['name']} is now live in the directory."}
