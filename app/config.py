import os
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"
STATIC = BASE / "frontend" / "dist"
EXAMS_DIR = Path(os.environ.get("EXAMS_DIR", DATA / "exams"))
DB_PATH = os.environ.get("DB_PATH", str(BASE / "mock.db"))
PASSCODE = os.environ.get("PASSCODE", "change-me")
ADMIN_PASSCODE = os.environ.get("ADMIN_PASSCODE", "")
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-secret")
APP_ENV = os.environ.get("APP_ENV", "development").lower()
ADMIN_ENABLED = bool(ADMIN_PASSCODE) and SECRET_KEY != "dev-only-secret" and len(SECRET_KEY) >= 32
SECURE_COOKIES = os.environ.get("SECURE_COOKIES", "0") == "1"
SESSION_SECONDS = 14 * 24 * 3600
ADMIN_SESSION_SECONDS = 8 * 3600


def validate_settings() -> None:
    if APP_ENV != "production":
        return

    problems: list[str] = []
    if len(PASSCODE) < 12:
        problems.append("PASSCODE must be at least 12 characters")
    if len(ADMIN_PASSCODE) < 12:
        problems.append("ADMIN_PASSCODE must be at least 12 characters")
    if PASSCODE == ADMIN_PASSCODE:
        problems.append("PASSCODE and ADMIN_PASSCODE must be different")
    if SECRET_KEY == "dev-only-secret" or len(SECRET_KEY) < 32:
        problems.append("SECRET_KEY must be a random value of at least 32 characters")
    if not SECURE_COOKIES:
        problems.append("SECURE_COOKIES must be 1 when APP_ENV=production")
    if problems:
        raise RuntimeError("Invalid production configuration: " + "; ".join(problems))
