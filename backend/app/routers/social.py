from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Any, Optional
from app.dependencies import get_supabase, get_current_user

router = APIRouter()

WORKOUT_EMOJIS = {
    "weights": "🏋️",
    "cardio": "🏃",
    "bjj_mma": "🥋",
    "other": "⚡",
}


# ─── Schemas ──────────────────────────────────────────────────────────────────

class FeedItem(BaseModel):
    id: str
    user_id: str
    user_name: str
    workout_type: str
    workout_emoji: str
    name: str
    duration_min: int
    calories_burned: int
    exercise_count: int
    caption: Optional[str]
    log_date: str
    created_at: str
    likes_count: int
    liked_by_me: bool


class UserResult(BaseModel):
    id: str
    full_name: str
    is_following: bool


class FollowStats(BaseModel):
    followers: int
    following: int


# ─── Feed ─────────────────────────────────────────────────────────────────────

@router.get("/feed", response_model=list[FeedItem])
def get_feed(
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    uid = current_user["id"]

    # Get IDs this user follows (include self so you see your own posts too)
    follow_res = (
        supabase.table("follows")
        .select("following_id")
        .eq("follower_id", uid)
        .execute()
    )
    following_ids = [r["following_id"] for r in (follow_res.data or [])]
    following_ids.append(uid)

    # Fetch shared workouts from those users
    workouts_res = (
        supabase.table("workout_logs")
        .select("*")
        .eq("is_shared", True)
        .in_("user_id", following_ids)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    workouts = workouts_res.data or []
    if not workouts:
        return []

    # Fetch profiles for those users in one query
    user_ids = list({w["user_id"] for w in workouts})
    profiles_res = (
        supabase.table("profiles")
        .select("id, full_name")
        .in_("id", user_ids)
        .execute()
    )
    profile_map = {p["id"]: p["full_name"] for p in (profiles_res.data or [])}

    # Fetch likes for these workouts
    workout_ids = [w["id"] for w in workouts]
    likes_res = (
        supabase.table("activity_likes")
        .select("workout_log_id, user_id")
        .in_("workout_log_id", workout_ids)
        .execute()
    )
    likes = likes_res.data or []
    likes_count_map: dict[str, int] = {}
    liked_by_me: set[str] = set()
    for like in likes:
        wid = like["workout_log_id"]
        likes_count_map[wid] = likes_count_map.get(wid, 0) + 1
        if like["user_id"] == uid:
            liked_by_me.add(wid)

    items = []
    for w in workouts:
        exercises = w.get("exercises") or []
        items.append(
            FeedItem(
                id=w["id"],
                user_id=w["user_id"],
                user_name=profile_map.get(w["user_id"], "Unknown"),
                workout_type=w["workout_type"],
                workout_emoji=WORKOUT_EMOJIS.get(w["workout_type"], "⚡"),
                name=w["name"],
                duration_min=w["duration_min"],
                calories_burned=w["calories_burned"],
                exercise_count=len(exercises),
                caption=w.get("caption"),
                log_date=str(w["log_date"]),
                created_at=str(w["created_at"]),
                likes_count=likes_count_map.get(w["id"], 0),
                liked_by_me=w["id"] in liked_by_me,
            )
        )
    return items


# ─── User search ──────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserResult])
def search_users(
    q: str = Query("", min_length=0),
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    uid = current_user["id"]
    query = supabase.table("profiles").select("id, full_name").neq("id", uid)
    if q:
        query = query.ilike("full_name", f"%{q}%")
    results = query.limit(20).execute()
    users = results.data or []

    # Get who I follow
    follows_res = (
        supabase.table("follows")
        .select("following_id")
        .eq("follower_id", uid)
        .execute()
    )
    following_ids = {r["following_id"] for r in (follows_res.data or [])}

    return [
        UserResult(id=u["id"], full_name=u["full_name"], is_following=u["id"] in following_ids)
        for u in users
        if u.get("full_name")
    ]


# ─── Follow / Unfollow ────────────────────────────────────────────────────────

@router.post("/follow/{target_id}", status_code=204)
def follow_user(
    target_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    uid = current_user["id"]
    if uid == target_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    supabase.table("follows").upsert(
        {"follower_id": uid, "following_id": target_id},
        on_conflict="follower_id,following_id",
    ).execute()


@router.delete("/follow/{target_id}", status_code=204)
def unfollow_user(
    target_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    supabase.table("follows").delete().eq("follower_id", current_user["id"]).eq("following_id", target_id).execute()


@router.get("/follow-stats", response_model=FollowStats)
def follow_stats(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    uid = current_user["id"]
    followers = supabase.table("follows").select("follower_id", count="exact").eq("following_id", uid).execute()
    following = supabase.table("follows").select("following_id", count="exact").eq("follower_id", uid).execute()
    return FollowStats(
        followers=followers.count or 0,
        following=following.count or 0,
    )


# ─── Likes ────────────────────────────────────────────────────────────────────

@router.post("/like/{workout_id}", status_code=204)
def like_workout(
    workout_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    supabase.table("activity_likes").upsert(
        {"user_id": current_user["id"], "workout_log_id": workout_id},
        on_conflict="user_id,workout_log_id",
    ).execute()


@router.delete("/like/{workout_id}", status_code=204)
def unlike_workout(
    workout_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    supabase.table("activity_likes").delete().eq("user_id", current_user["id"]).eq("workout_log_id", workout_id).execute()
