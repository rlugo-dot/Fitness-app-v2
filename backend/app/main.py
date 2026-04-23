from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import profile, foods, meals, water, workouts, health, food_scan, integrations, weight, social, recommendations, analytics, professionals

app = FastAPI(title="Nutrisyon API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router,  prefix="/api/profile",  tags=["profile"])
app.include_router(foods.router,    prefix="/api/foods",    tags=["foods"])
app.include_router(meals.router,    prefix="/api/meals",    tags=["meals"])
app.include_router(water.router,    prefix="/api/water",    tags=["water"])
app.include_router(workouts.router, prefix="/api/workouts", tags=["workouts"])
app.include_router(health.router,     prefix="/api/health",     tags=["health"])
app.include_router(food_scan.router,    prefix="/api/food-scan",    tags=["food-scan"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])
app.include_router(weight.router,       prefix="/api/weight",       tags=["weight"])
app.include_router(social.router,           prefix="/api/social",           tags=["social"])
app.include_router(recommendations.router,  prefix="/api/recommendations",  tags=["recommendations"])
app.include_router(analytics.router,        prefix="/api/analytics",        tags=["analytics"])
app.include_router(professionals.router,    prefix="/api/professionals",    tags=["professionals"])


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
