from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime, timezone
from app.dependencies import get_supabase, get_current_user

router = APIRouter()


class StartConversation(BaseModel):
    professional_id: str


class SendMessage(BaseModel):
    content: str


@router.post("/conversations")
def start_conversation(
    body: StartConversation,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    existing = (
        supabase.table("conversations")
        .select("*")
        .eq("user_id", current_user["id"])
        .eq("professional_id", body.professional_id)
        .execute()
    )
    if existing.data:
        return existing.data[0]

    result = supabase.table("conversations").insert({
        "user_id": current_user["id"],
        "professional_id": body.professional_id,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    return result.data[0]


@router.get("/conversations")
def list_conversations(
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    result = (
        supabase.table("conversations")
        .select("*, professionals(name, title, avatar_emoji, avatar_color)")
        .eq("user_id", current_user["id"])
        .order("last_message_at", desc=True)
        .execute()
    )

    convos = []
    for conv in (result.data or []):
        last = (
            supabase.table("messages")
            .select("content, created_at, sender_type")
            .eq("conversation_id", conv["id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        conv["last_message"] = last.data[0] if last.data else None
        conv["professional"] = conv.pop("professionals", None)
        convos.append(conv)

    return convos


@router.get("/conversations/{conv_id}")
def get_conversation(
    conv_id: str,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    conv = (
        supabase.table("conversations")
        .select("*, professionals(name, title, avatar_emoji, avatar_color)")
        .eq("id", conv_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    row = conv.data[0]
    row["professional"] = row.pop("professionals", None)

    msgs = (
        supabase.table("messages")
        .select("*")
        .eq("conversation_id", conv_id)
        .order("created_at")
        .execute()
    )
    return {"conversation": row, "messages": msgs.data or []}


@router.post("/conversations/{conv_id}/send")
def send_message(
    conv_id: str,
    body: SendMessage,
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    conv = (
        supabase.table("conversations")
        .select("id")
        .eq("id", conv_id)
        .eq("user_id", current_user["id"])
        .execute()
    )
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = supabase.table("messages").insert({
        "conversation_id": conv_id,
        "sender_id": current_user["id"],
        "sender_type": "user",
        "content": body.content.strip(),
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to send message")

    now = datetime.now(timezone.utc).isoformat()
    supabase.table("conversations").update({"last_message_at": now}).eq("id", conv_id).execute()

    return result.data[0]
