from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.routers import profile, foods, meals, water, workouts, health, food_scan, integrations, weight, social, recommendations, analytics, professionals, notifications, applications, admin, payments, messages, pro
from app.limiter import limiter
from app.dependencies import get_supabase
from fastapi import Depends

app = FastAPI(title="Phitness API", version="1.0.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
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
app.include_router(notifications.router,   prefix="/api/notifications",   tags=["notifications"])
app.include_router(applications.router,    prefix="/api/applications",    tags=["applications"])
app.include_router(admin.router,           prefix="/api/admin",           tags=["admin"])
app.include_router(payments.router,        prefix="/api/payments",        tags=["payments"])
app.include_router(messages.router,        prefix="/api/messages",        tags=["messages"])
app.include_router(pro.router,             prefix="/api/pro",             tags=["pro"])


@app.api_route("/api/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok"}


@app.get("/api/ping")
def ping(supabase=Depends(get_supabase)):
    """Lightweight DB touch — used by UptimeRobot to keep Supabase from pausing."""
    supabase.table("profiles").select("user_id").limit(1).execute()
    return {"status": "ok"}
