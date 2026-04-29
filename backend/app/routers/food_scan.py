import base64
import json
import re
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Any
import anthropic
from app.dependencies import get_current_user
from app.config import ANTHROPIC_API_KEY
from app.limiter import limiter

router = APIRouter()

SYSTEM_PROMPT = """You are a Filipino food nutrition expert. When given a photo of food, you:
1. Identify the dish (prioritize Filipino foods and local ingredients)
2. Estimate the portion size based on visual cues
3. Provide accurate macro nutrient estimates

Always respond with ONLY valid JSON in this exact format:
{
  "food_name": "Name of the dish",
  "confidence": "high" | "medium" | "low",
  "portion_description": "e.g. 1 cup (approx 200g)",
  "estimated_grams": 200,
  "calories": 420,
  "protein_g": 22.0,
  "carbs_g": 8.0,
  "fat_g": 24.0,
  "fiber_g": 0.5,
  "notes": "Brief note about the food identification"
}"""


class ScanRequest(BaseModel):
    image_base64: str
    image_type: str = "image/jpeg"


class ScanResult(BaseModel):
    food_name: str
    confidence: str
    portion_description: str
    estimated_grams: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float
    notes: str


@router.post("", response_model=ScanResult)
@limiter.limit("5/15minutes")
def scan_food(
    request: Request,
    req: ScanRequest,
    current_user: dict = Depends(get_current_user),
):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="AI scanning not configured")

    # Strip data URL prefix if present
    image_data = req.image_base64
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    # Validate it's real base64
    try:
        base64.b64decode(image_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": req.image_type,
                            "data": image_data,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Identify this food and estimate its macros. Respond with JSON only.",
                    },
                ],
            }
        ],
    )

    raw = message.content[0].text.strip()

    # Extract JSON if wrapped in markdown code block
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise HTTPException(status_code=502, detail="Could not parse AI response")

    try:
        data = json.loads(match.group())
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Invalid JSON from AI")

    return ScanResult(
        food_name=data.get("food_name", "Unknown food"),
        confidence=data.get("confidence", "low"),
        portion_description=data.get("portion_description", ""),
        estimated_grams=float(data.get("estimated_grams", 100)),
        calories=float(data.get("calories", 0)),
        protein_g=float(data.get("protein_g", 0)),
        carbs_g=float(data.get("carbs_g", 0)),
        fat_g=float(data.get("fat_g", 0)),
        fiber_g=float(data.get("fiber_g", 0)),
        notes=data.get("notes", ""),
    )
