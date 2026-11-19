import os
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"
STATIC = BASE / "frontend" / "dist"
EXAMS_DIR = Path(os.environ.get("EXAMS_DIR", DATA / "exams"))
DB_PATH = os.environ.get("DB_PATH", str(BASE / "mock.db"))
PASSCODE = os.environ.get("PASSCODE", "change-me")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-secret")
SECURE_COOKIES = os.environ.get("SECURE_COOKIES", "0") == "1"
SESSION_SECONDS = 14 * 24 * 3600
