import json
import re
import anthropic
from datetime import date as date_type, datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Any, Optional
from app.dependencies import get_supabase, get_current_user
from app.config import ANTHROPIC_API_KEY

router = APIRouter()

SYSTEM_PROMPT = """You are a Filipino nutrition advisor. Given a user's remaining daily macros, suggest 4 practical meal options available in the Philippines that best fit those macros.

Mix your suggestions from:
- Local restaurant chains (Jollibee, Mang Inasal, Max's, Chowking, Army Navy, Greenwich, KFC, Subway, Yellow Cab, Bo's Coffee, 7-Eleven)
- Simple Filipino home recipes (arroz caldo, tinolang manok, pinakbet, sinigang, etc.)
- Convenience store options when appropriate (7-Eleven, Mini Stop)

Rules:
- Prioritize suggestions whose macros closely match what's remaining
- Use realistic Philippines prices in PHP (2024 pricing)
- Keep "why" to one short sentence
- "tip" is optional, only include if genuinely useful
- If remaining calories are very low (<200), suggest light options or say the user is close to goal

Respond with ONLY valid JSON — no markdown, no explanation:
{
  "suggestions": [
    {
      "name": "Meal name",
      "where": "Restaurant or 'Home Recipe'",
      "type": "restaurant|recipe|store",
      "price_php": 150,
      "calories": 400,
      "protein_g": 25.0,
      "carbs_g": 45.0,
      "fat_g": 12.0,
      "why": "Fits your remaining protein and calorie budget.",
      "tip": "Optional tip"
    }
  ]
}"""


class MealSuggestion(BaseModel):
    name: str
    where: str
    type: str
    price_php: int
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    why: str
    tip: Optional[str] = None


class RecommendationsResponse(BaseModel):
    meal_type: str
    daily_calorie_goal: int
    remaining_calories: int
    remaining_protein_g: int
    remaining_carbs_g: int
    remaining_fat_g: int
    suggestions: list[MealSuggestion]


def _auto_meal_type() -> str:
    hour = datetime.now().hour
    if hour < 10:
        return "breakfast"
    elif hour < 14:
        return "lunch"
    elif hour < 18:
        return "snack"
    return "dinner"


@router.get("", response_model=RecommendationsResponse)
def get_recommendations(
    log_date: Optional[str] = Query(None),
    meal_type: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    supabase: Any = Depends(get_supabase),
):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="AI recommendations not configured")

    target_date = log_date or str(date_type.today())
    suggested_meal = meal_type or _auto_meal_type()

    # Fetch profile for calorie goal
    profile_res = (
        supabase.table("profiles")
        .select("daily_calorie_goal")
        .eq("id", current_user["id"])
        .execute()
    )
    calorie_goal = (profile_res.data[0] if profile_res.data else {}).get("daily_calorie_goal", 2000)

    # Macro targets
    protein_target = round((calorie_goal * 0.30) / 4)
    carbs_target = round((calorie_goal * 0.45) / 4)
    fat_target = round((calorie_goal * 0.25) / 9)

    # Fetch today's food logs
    logs_res = (
        supabase.table("food_logs")
        .select("calories, protein_g, carbs_g, fat_g")
        .eq("user_id", current_user["id"])
        .eq("log_date", target_date)
        .execute()
    )
    logs = logs_res.data or []

    eaten_cal = sum(float(l["calories"]) for l in logs)
    eaten_protein = sum(float(l["protein_g"]) for l in logs)
    eaten_carbs = sum(float(l["carbs_g"]) for l in logs)
    eaten_fat = sum(float(l["fat_g"]) for l in logs)

    remaining_cal = max(0, round(calorie_goal - eaten_cal))
    remaining_protein = max(0, round(protein_target - eaten_protein))
    remaining_carbs = max(0, round(carbs_target - eaten_carbs))
    remaining_fat = max(0, round(fat_target - eaten_fat))

    user_prompt = (
        f"Meal type: {suggested_meal}\n"
        f"Remaining today:\n"
        f"  Calories: {remaining_cal} kcal\n"
        f"  Protein:  {remaining_protein}g\n"
        f"  Carbs:    {remaining_carbs}g\n"
        f"  Fat:      {remaining_fat}g\n\n"
        f"Suggest 4 meals that fit these remaining macros."
    )

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw = message.content[0].text.strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise HTTPException(status_code=502, detail="Could not parse AI response")

    try:
        data = json.loads(match.group())
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Invalid JSON from AI")

    suggestions = []
    for s in data.get("suggestions", [])[:4]:
        suggestions.append(
            MealSuggestion(
                name=s.get("name", ""),
                where=s.get("where", ""),
                type=s.get("type", "restaurant"),
                price_php=int(s.get("price_php", 0)),
                calories=int(s.get("calories", 0)),
                protein_g=float(s.get("protein_g", 0)),
                carbs_g=float(s.get("carbs_g", 0)),
                fat_g=float(s.get("fat_g", 0)),
                why=s.get("why", ""),
                tip=s.get("tip") or None,
            )
        )

    return RecommendationsResponse(
        meal_type=suggested_meal,
        daily_calorie_goal=calorie_goal,
        remaining_calories=remaining_cal,
        remaining_protein_g=remaining_protein,
        remaining_carbs_g=remaining_carbs,
        remaining_fat_g=remaining_fat,
        suggestions=suggestions,
    )
