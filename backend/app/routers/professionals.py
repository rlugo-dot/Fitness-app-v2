from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Any, Optional
from datetime import date as date_type
from app.dependencies import get_supabase, get_current_user

router = APIRouter()


class Professional(BaseModel):
    id: str
    name: str
    title: str
    specialties: list[str]
    bio: str
    rate_php: int
    location: str
    years_exp: int
    avatar_emoji: str
    avatar_color: str
    is_available: bool


class BookingRequest(BaseModel):
    professional_id: str
    message: str
    preferred_date: Optional[str] = None   # YYYY-MM-DD


class ProSummary(BaseModel):
    name: str
    title: str
    avatar_emoji: str
    avatar_color: str


class BookingOut(BaseModel):
    id: str
    professional_id: str
    message: str
    preferred_date: Optional[str]
    status: str
    created_at: str
    professional: Optional[ProSummary] = None


# ─── Directory ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[Professional])
def list_professionals(
    specialty: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    supabase: Any = Depends(get_supabase),
):
    query = supabase.table("professionals").select(
        "id, name, title, specialties, bio, rate_php, location, years_exp, avatar_emoji, avatar_color, is_available"
    ).order("name")

    result = query.execute()
    rows = result.data or []

    if specialty:
        rows = [r for r in rows if specialty in r.get("specialties", [])]
    if q:
        ql = q.lower()
        rows = [r for r in rows if ql in r["name"].lower() or ql in r["title"].lower() or any(ql in s.lower() for s in r.get("specialties", []))]

    return rows


@router.get("/specialties", response_model=list[str])
def list_specialties(supabase: Any = Depends(get_supabase)):
    result = supabase.table("professionals").select("specialties").execute()
    seen = set()
    specialties = []
    for row in (result.data or []):
        for s in (row.get("specialties") or []):
            if s not in seen:
                seen.add(s)
                specialties.append(s)
    return sorted(specialties)


@router.get("/{pro_id}", response_model=Professional)
def get_professional(pro_id: str, supabase: Any = Depends(get_supabase)):
    result = (
        supabase.table("professionals")
        .select("id, name, title, specialties, bio, rate_php, location, years_exp, avatar_emoji, avatar_color, is_available")
        .eq("id", pro_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Professional not found")
    return result.data[0]


# ─── Booking requests ─────────────────────────────────────────────────────────

@router.post("/book", response_model=BookingOut)
def book_professional(
    body: BookingRequest,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    # Verify professional exists
    pro = supabase.table("professionals").select("id, is_available").eq("id", body.professional_id).execute()
    if not pro.data:
        raise HTTPException(status_code=404, detail="Professional not found")
    if not pro.data[0].get("is_available"):
        raise HTTPException(status_code=400, detail="Professional is not currently accepting bookings")

    payload = {
        "user_id": current_user["id"],
        "professional_id": body.professional_id,
        "message": body.message.strip(),
        "preferred_date": body.preferred_date,
        "status": "pending",
    }
    result = supabase.table("booking_requests").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create booking request")
    return result.data[0]


@router.get("/my-bookings", response_model=list[BookingOut])
def my_bookings(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("booking_requests")
        .select("*, professionals(name, title, avatar_emoji, avatar_color)")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    rows = []
    for row in (result.data or []):
        pro_data = row.pop("professionals", None)
        row["professional"] = pro_data
        rows.append(row)
    return rows
