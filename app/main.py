import hmac
import json
import sqlite3
import time
from collections.abc import Iterator

from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from itsdangerous import BadSignature, URLSafeTimedSerializer
from pydantic import BaseModel, ValidationError

from . import attempts, config, db
from .attempts import fail
from .exams import Exam, delete_exam, load_exams, save_exam, validate_exam_topics

config.validate_settings()
load_exams()
signer = URLSafeTimedSerializer(config.SECRET_KEY)
admin_signer = URLSafeTimedSerializer(config.SECRET_KEY, salt="admin-session")
MAX_EXAM_UPLOAD_BYTES = 5 * 1024 * 1024
db.init()

app = FastAPI(title="FDA Mock Exam", docs_url=None, redoc_url=None)
app.add_middleware(GZipMiddleware, minimum_size=800)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.update({
        "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin",
        "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'"})
    return response


@app.exception_handler(HTTPException)
async def http_error(_: Request, e: HTTPException) -> JSONResponse:
    detail = e.detail if isinstance(e.detail, dict) else {"code": "ERROR", "message": str(e.detail)}
    return JSONResponse({"error": detail}, status_code=e.status_code)


def get_conn() -> Iterator[sqlite3.Connection]:
    conn = db.connect()
    try:
        yield conn
    finally:
        conn.close()


def require_auth(request: Request) -> None:
    try:
        signer.loads(request.cookies.get("session", ""), max_age=config.SESSION_SECONDS)
    except BadSignature:
        fail(401, "UNAUTHORIZED", "Login required")


def require_admin(request: Request) -> None:
    if not config.ADMIN_ENABLED:
        fail(503, "ADMIN_DISABLED", "Set ADMIN_PASSCODE and a random SECRET_KEY of at least 32 characters")
    try:
        admin_signer.loads(
            request.cookies.get("admin_session", ""),
            max_age=config.ADMIN_SESSION_SECONDS,
        )
    except BadSignature:
        fail(401, "ADMIN_UNAUTHORIZED", "Admin login required")


_failed_logins: dict[str, list[float]] = {}
_failed_admin_logins: dict[str, list[float]] = {}


class Login(BaseModel):
    passcode: str


class Start(BaseModel):
    exam_id: str


class Answer(BaseModel):
    choice: int | str


public = APIRouter(prefix="/api/auth")
api = APIRouter(prefix="/api", dependencies=[Depends(require_auth)])
admin_auth = APIRouter(prefix="/api/admin/auth")
admin_api = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])


@public.post("/login")
def login(body: Login, request: Request, response: Response) -> dict:
    ip, now = (request.client.host if request.client else "?"), time.time()
    recent = [t for t in _failed_logins.get(ip, []) if now - t < 600]
    if len(recent) >= 5:
        fail(429, "RATE_LIMITED", "Too many attempts. Try again later")
    if not hmac.compare_digest(body.passcode.encode(), config.PASSCODE.encode()):
        _failed_logins[ip] = recent + [now]
        fail(401, "BAD_PASSCODE", "Wrong passcode")
    response.set_cookie("session", signer.dumps("ok"), httponly=True, samesite="lax",
                        secure=config.SECURE_COOKIES, max_age=config.SESSION_SECONDS)
    return {"ok": True}


@public.post("/logout")
def logout(response: Response) -> dict:
    response.delete_cookie("session")
    return {"ok": True}


@admin_auth.post("/login")
def admin_login(body: Login, request: Request, response: Response) -> dict:
    if not config.ADMIN_ENABLED:
        fail(503, "ADMIN_DISABLED", "Set ADMIN_PASSCODE and a random SECRET_KEY of at least 32 characters")
    ip, now = (request.client.host if request.client else "?"), time.time()
    recent = [t for t in _failed_admin_logins.get(ip, []) if now - t < 600]
    if len(recent) >= 5:
        fail(429, "RATE_LIMITED", "Too many admin login attempts. Try again later")
    if not hmac.compare_digest(body.passcode.encode(), config.ADMIN_PASSCODE.encode()):
        _failed_admin_logins[ip] = recent + [now]
        fail(401, "BAD_ADMIN_PASSCODE", "Admin passcode is incorrect")
    response.set_cookie(
        "admin_session", admin_signer.dumps("admin"), httponly=True,
        samesite="strict", secure=config.SECURE_COOKIES,
        max_age=config.ADMIN_SESSION_SECONDS, path="/api/admin",
    )
    return {"ok": True}


@admin_auth.get("/me", dependencies=[Depends(require_admin)])
def admin_me() -> dict:
    return {"ok": True}


@admin_auth.post("/logout")
def admin_logout(response: Response) -> dict:
    response.delete_cookie("admin_session", path="/api/admin")
    return {"ok": True}


@api.get("/auth/me")
def me() -> dict:
    return {"ok": True}


@api.get("/exams")
def list_exams() -> list[dict]:
    return [{"exam_id": e.exam_id, "title": e.title, "description": e.description,
             "duration_minutes": e.duration_minutes, "questions": len(e.questions),
             "marks": {"correct": str(e.marks_correct), "wrong": str(e.marks_wrong),
                       "blank": str(e.marks_blank), "decline": str(e.marks_decline)}}
            for e in load_exams().values()]


@admin_api.get("/exams")
def list_admin_exams() -> list[dict]:
    return [{"exam_id": e.exam_id, "title": e.title,
             "duration_minutes": e.duration_minutes, "questions": len(e.questions)}
            for e in load_exams().values()]


@admin_api.post("/exams")
async def upload_exam(request: Request) -> dict:
    content_length = request.headers.get("content-length")
    if content_length is not None:
        try:
            if int(content_length) > MAX_EXAM_UPLOAD_BYTES:
                fail(413, "EXAM_TOO_LARGE", "Exam JSON must be 5 MB or smaller")
        except ValueError:
            fail(400, "BAD_CONTENT_LENGTH", "Invalid request content length")

    raw = bytearray()
    async for chunk in request.stream():
        if len(raw) + len(chunk) > MAX_EXAM_UPLOAD_BYTES:
            fail(413, "EXAM_TOO_LARGE", "Exam JSON must be 5 MB or smaller")
        raw.extend(chunk)
    try:
        exam = Exam.model_validate_json(bytes(raw))
    except ValidationError as e:
        details = "; ".join(
            f"{'.'.join(str(part) for part in issue['loc'])}: {issue['msg']}"
            for issue in e.errors(include_input=False)
        )
        fail(422, "INVALID_EXAM", details or "Exam JSON is invalid")
    try:
        validate_exam_topics(exam)
        replaced = save_exam(exam)
    except ValueError as e:
        fail(422, "INVALID_EXAM", str(e))
    except OSError:
        fail(500, "EXAM_STORAGE_ERROR", "Could not save the exam. Check that EXAMS_DIR is writable.")
    return {"exam_id": exam.exam_id, "title": exam.title, "replaced": replaced}


@admin_api.delete("/exams/{exam_id}")
def remove_exam(exam_id: str) -> dict:
    try:
        delete_exam(exam_id)
    except KeyError:
        fail(404, "NO_EXAM", "Exam not found")
    except ValueError as e:
        fail(422, "INVALID_EXAM_ID", str(e))
    except OSError:
        fail(500, "EXAM_STORAGE_ERROR", "Could not remove the exam. Check that EXAMS_DIR is writable.")
    return {"ok": True}


@api.get("/attempts")
def list_attempts(conn: sqlite3.Connection = Depends(get_conn)) -> list[dict]:
    return attempts.history(conn)


@api.post("/attempts")
def start_attempt(body: Start, conn: sqlite3.Connection = Depends(get_conn)) -> dict:
    exam = load_exams().get(body.exam_id)
    if exam is None:
        fail(404, "NO_EXAM", "Exam not found")
    return attempts.start(conn, exam)


@api.get("/attempts/{aid}")
def get_attempt(aid: str, conn: sqlite3.Connection = Depends(get_conn)) -> dict:
    return attempts.payload(conn, attempts.load(conn, aid))


@api.put("/attempts/{aid}/answers/{qid}")
def put_answer(aid: str, qid: str, body: Answer, conn: sqlite3.Connection = Depends(get_conn)) -> dict:
    attempts.save_answer(conn, aid, qid, str(body.choice))
    return {"locked": True}


@api.post("/attempts/{aid}/submit")
def submit(aid: str, conn: sqlite3.Connection = Depends(get_conn)) -> dict:
    a = attempts.load(conn, aid)
    if a["status"] == "in_progress":
        attempts.finalize(conn, a, auto=False)
    return {"status": "submitted"}


@api.get("/attempts/{aid}/result")
def result(aid: str, conn: sqlite3.Connection = Depends(get_conn)) -> dict:
    a = attempts.load(conn, aid)
    if a["status"] != "submitted":
        fail(409, "NOT_SUBMITTED", "Submit the attempt first")
    return json.loads(a["result"])


app.include_router(public)
app.include_router(admin_auth)
app.include_router(admin_api)
app.include_router(api)


@app.get("/admin", include_in_schema=False)
@app.get("/admin/", include_in_schema=False)
def admin_page() -> FileResponse:
    index = config.STATIC / "index.html"
    if not index.is_file():
        fail(404, "NOT_FOUND", "Admin interface is unavailable")
    return FileResponse(index)


if config.STATIC.is_dir():  # built frontend; in dev, Vite serves the UI instead
    app.mount("/", StaticFiles(directory=config.STATIC, html=True), name="static")
