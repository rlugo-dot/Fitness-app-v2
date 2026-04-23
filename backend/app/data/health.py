"""
Health conditions and their diet recommendations.
"""

CONDITIONS = [
    {"id": "pcos",             "label": "PCOS",              "emoji": "🌸"},
    {"id": "diabetes",         "label": "Diabetes",           "emoji": "🩸"},
    {"id": "hypertension",     "label": "Hypertension",       "emoji": "❤️"},
    {"id": "ibs",              "label": "IBS",                "emoji": "🫁"},
    {"id": "high_cholesterol", "label": "High Cholesterol",   "emoji": "🧈"},
    {"id": "gout",             "label": "Gout",               "emoji": "🦶"},
    {"id": "hypothyroidism",   "label": "Hypothyroidism",     "emoji": "🦋"},
]

DIET_RECOMMENDATIONS: dict[str, dict] = {
    "pcos": {
        "title": "PCOS Diet",
        "summary": "Focus on low-GI foods to manage insulin resistance and hormone balance.",
        "eat_more": [
            "Leafy greens (kangkong, pechay, malunggay)",
            "High-fiber foods (oatmeal, brown rice, kamote)",
            "Lean protein (chicken, fish, tofu, eggs)",
            "Healthy fats (avocado, nuts, olive oil)",
            "Anti-inflammatory spices (turmeric, ginger)",
        ],
        "limit": [
            "White rice and refined carbs",
            "Sugary drinks and sweets",
            "Processed/fried foods",
            "Full-fat dairy in large amounts",
        ],
        "tips": [
            "Eat smaller, more frequent meals to stabilise blood sugar",
            "Aim for 25–30g of fibre daily",
            "Stay hydrated — at least 8 glasses of water",
            "Pair carbs with protein or fat to slow glucose absorption",
        ],
        "calorie_note": "A modest 5–10% body weight reduction can significantly improve symptoms.",
    },
    "diabetes": {
        "title": "Diabetes Diet",
        "summary": "Manage blood sugar through consistent carb intake and low-GI food choices.",
        "eat_more": [
            "Non-starchy vegetables (ampalaya, sitaw, okra)",
            "Whole grains (brown rice, oats, whole wheat pan de sal)",
            "Lean proteins (grilled fish, chicken breast, tofu)",
            "Legumes (monggo, black beans)",
            "Ampalaya (bitter gourd) — known to help lower blood sugar",
        ],
        "limit": [
            "White rice (reduce portion — use ¾ cup cooked)",
            "Sweet drinks (softdrinks, juice, sago't gulaman)",
            "Sweetened breads and pastries",
            "High-fat meats (lechon, chicharon)",
        ],
        "tips": [
            "Space meals 4–5 hours apart for stable glucose",
            "Use the plate method: ½ vegetables, ¼ protein, ¼ carbs",
            "Check labels — watch for hidden sugars",
            "Walk 15–20 minutes after meals to aid glucose uptake",
        ],
        "calorie_note": "Consistent meal timing matters as much as food choice for blood sugar control.",
    },
    "hypertension": {
        "title": "Hypertension Diet",
        "summary": "Follow a low-sodium, potassium-rich eating pattern (DASH diet approach).",
        "eat_more": [
            "Potassium-rich foods (banana, kamote, coconut water)",
            "Magnesium sources (dark leafy greens, nuts, seeds)",
            "Calcium-rich foods (low-fat milk, tokwa, sardines)",
            "Oily fish (bangus, galunggong, tuna) for omega-3",
            "Garlic and onion — natural blood pressure support",
        ],
        "limit": [
            "Salty condiments (patis, toyo, bagoong, vetsin)",
            "Processed meats (tocino, longganisa, hotdog)",
            "Canned goods and instant noodles",
            "Alcohol and caffeine in excess",
        ],
        "tips": [
            "Target sodium below 2,300mg/day (ideally 1,500mg)",
            "Cook with herbs and citrus instead of salt",
            "Avoid adding patis or toyo at the table",
            "DASH diet: rich in fruits, vegetables, low-fat dairy",
        ],
        "calorie_note": "Losing 5kg can reduce systolic blood pressure by 5–10 mmHg.",
    },
    "ibs": {
        "title": "IBS Diet",
        "summary": "Identify personal trigger foods; generally follow a low-FODMAP approach.",
        "eat_more": [
            "Low-FODMAP fruits (banana, grapes, oranges)",
            "Plain white rice (easier to digest than brown)",
            "Boiled or steamed vegetables (carrots, zucchini, pechay)",
            "Lean grilled protein (chicken, fish)",
            "Ginger tea for bloating relief",
        ],
        "limit": [
            "High-FODMAP foods (garlic, onion, monggo, apple, mango)",
            "Dairy (milk, ice cream) if lactose intolerant",
            "Carbonated drinks",
            "Spicy food and chili",
            "Caffeine and alcohol",
        ],
        "tips": [
            "Keep a food diary to track personal triggers",
            "Eat slowly and chew thoroughly",
            "Eat smaller meals more frequently",
            "Manage stress — IBS is strongly linked to gut-brain axis",
        ],
        "calorie_note": "Calorie needs are normal; focus is on managing symptoms, not restriction.",
    },
    "high_cholesterol": {
        "title": "High Cholesterol Diet",
        "summary": "Reduce saturated fat and increase soluble fibre to lower LDL cholesterol.",
        "eat_more": [
            "Soluble fibre (oatmeal, apples, monggo, okra)",
            "Oily fish (bangus, tuna, salmon) 2–3x per week",
            "Nuts (almonds, walnuts) in small portions",
            "Plant sterols (found in whole grains, nuts, seeds)",
            "Olive oil or canola oil instead of lard/butter",
        ],
        "limit": [
            "Fatty meats and skin-on chicken",
            "Lechon, chicharon, crispy pata",
            "Full-fat coconut milk in large amounts",
            "Egg yolks (limit to 4/week if LDL is very high)",
            "Hydrogenated oils and margarine",
        ],
        "tips": [
            "Remove skin from chicken before cooking",
            "Use cooking methods: grill, steam, bake instead of fry",
            "Add chia seeds or flaxseed to meals for extra fibre",
            "Check labels for trans fat (partially hydrogenated oils)",
        ],
        "calorie_note": "Even a 10% reduction in dietary saturated fat can lower LDL by 8–10%.",
    },
    "gout": {
        "title": "Gout Diet",
        "summary": "Limit purine-rich foods to reduce uric acid buildup in the joints.",
        "eat_more": [
            "Cherries and cherry juice (shown to reduce gout attacks)",
            "Low-fat dairy (skim milk, low-fat yogurt)",
            "Complex carbs (brown rice, oats, kamote)",
            "Vitamin C rich foods (calamansi, guava, pepper)",
            "Plain water — minimum 8 glasses/day to flush uric acid",
        ],
        "limit": [
            "High-purine proteins (internal organs, sardines, anchovies)",
            "Red meat in large portions",
            "Shellfish (hipon, tahong, talaba)",
            "Alcohol especially beer",
            "Sweetened drinks with fructose (softdrinks, juice)",
        ],
        "tips": [
            "Drink water consistently throughout the day",
            "Avoid fasting — it raises uric acid levels",
            "Lose weight gradually; rapid weight loss worsens gout",
            "Take medications as prescribed during flare-ups",
        ],
        "calorie_note": "Maintain a healthy weight — obesity is a major risk factor for gout.",
    },
    "hypothyroidism": {
        "title": "Hypothyroidism Diet",
        "summary": "Support thyroid function with iodine and selenium; time meals around medication.",
        "eat_more": [
            "Iodine-rich foods (iodised salt, seafood, seaweed)",
            "Selenium sources (tuna, eggs, brown rice, sunflower seeds)",
            "Zinc foods (beef, chicken, pumpkin seeds)",
            "Anti-inflammatory foods (berries, leafy greens, olive oil)",
            "Lean proteins to support metabolism",
        ],
        "limit": [
            "Raw goitrogenic vegetables in large amounts (broccoli, cabbage, kamote tops) — cook them instead",
            "Soy products in excess near medication time",
            "Gluten if also sensitive (some hypothyroid patients benefit)",
            "Processed and high-sugar foods",
            "Excessive caffeine and alcohol",
        ],
        "tips": [
            "Take thyroid medication on an empty stomach, 30–60 min before eating",
            "Avoid calcium supplements or iron within 4 hours of medication",
            "Cooking goitrogenic vegetables reduces their thyroid impact",
            "Regular light exercise supports metabolism",
        ],
        "calorie_note": "Hypothyroidism slows metabolism — slight calorie reduction (200–300 kcal) may help with weight.",
    },
}


def get_recommendations_for_conditions(conditions: list[str]) -> list[dict]:
    results = []
    for cid in conditions:
        rec = DIET_RECOMMENDATIONS.get(cid)
        if rec:
            results.append({"condition_id": cid, **rec})
    return results
