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
