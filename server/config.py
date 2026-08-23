import os
from pathlib import Path
from dotenv import load_dotenv

# Load root .env if present
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

AIML_DIR = ROOT_DIR / "AIML"
DATA_DIR = AIML_DIR / "data"
MODELS_DIR = AIML_DIR / "models"

# Security & JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretjwtkey123!")
REFRESH_TOKEN_SECRET = os.getenv("REFRESH_TOKEN_SECRET", "supersecretrefreshkey123!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# External Database URL (if connecting directly to PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Server configuration
PORT = int(os.getenv("PORT", 7860))
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
