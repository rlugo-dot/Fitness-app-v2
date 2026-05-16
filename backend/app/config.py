from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_EMAIL = os.getenv("VAPID_EMAIL", "richardlyonneuygo@gmail.com")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "richardlyonneuygo@gmail.com")
MONTHLY_FEE_PHP = int(os.getenv("MONTHLY_FEE_PHP", "999"))
PAYMONGO_SECRET_KEY = os.getenv("PAYMONGO_SECRET_KEY", "")
PAYMONGO_WEBHOOK_SECRET = os.getenv("PAYMONGO_WEBHOOK_SECRET", "")
APP_URL = os.getenv("APP_URL", "https://fitness-app-v2-two.vercel.app")
SUBSCRIPTION_PRICE_PHP = int(os.getenv("SUBSCRIPTION_PRICE_PHP", "299"))
SUBSCRIPTION_DAYS = int(os.getenv("SUBSCRIPTION_DAYS", "30"))
