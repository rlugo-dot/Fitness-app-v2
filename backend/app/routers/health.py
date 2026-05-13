from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any
import json
from anthropic import Anthropic
from app.dependencies import get_supabase, get_current_user
from app.data.health import CONDITIONS, get_recommendations_for_conditions
from app.config import ANTHROPIC_API_KEY

router = APIRouter()


class UpdateConditionsRequest(BaseModel):
    conditions: list[str]


class SymptomRequest(BaseModel):
    symptoms: str


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
        .execute()
    )
    return {"conditions": (result.data[0].get("health_conditions") or []) if result.data else []}


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
        .execute()
    )
    conditions = (result.data[0].get("health_conditions") or []) if result.data else []
    return get_recommendations_for_conditions(conditions)


@router.post("/symptom-check")
def check_symptoms(
    req: SymptomRequest,
    current_user: dict = Depends(get_current_user),
):
    condition_list = ", ".join(f"{c['id']}={c['label']}" for c in CONDITIONS)
    ids = [c["id"] for c in CONDITIONS]

    prompt = f"""You are a health screening assistant for a Filipino health app. A user described their symptoms. Based only on the conditions listed below, suggest which ones they should discuss with a doctor.

Available conditions (id=label): {condition_list}

User symptoms: {req.symptoms.strip()}

Respond ONLY with valid JSON, no extra text:
{{
  "matches": [
    {{"id": "<condition_id>", "label": "<condition_label>", "reason": "<1 sentence why this matches>"}}
  ],
  "urgent": false,
  "summary": "<1-2 sentence overview and reminder this is not a diagnosis>"
}}

Rules:
- Only include conditions from the list above (use exact ids: {ids})
- Maximum 3 matches, only include clear matches
- Set urgent=true only for symptoms suggesting emergency (severe chest pain, can't breathe, etc.)
- If nothing clearly matches, return empty matches array"""

    try:
        client = Anthropic(api_key=ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        return json.loads(message.content[0].text)
    except Exception:
        return {
            "matches": [],
            "urgent": False,
            "summary": "Unable to analyse symptoms right now. Please consult a doctor or select conditions manually above.",
        }
