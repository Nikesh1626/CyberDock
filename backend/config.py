import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Settings:
    PROJECT_NAME: str = "CyberDock API"
    API_V1_STR: str = "/api/v1"
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://xyzcompany.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "your-anon-key")

settings = Settings()
