"""Attempt lifecycle: start, lock answers, expire, finalize."""
import json
import sqlite3
import time
import uuid

from fastapi import HTTPException

from .exams import Exam, topics
from .scoring import evaluate

VALID = {"0", "1", "2", "3", "E"}


def fail(status: int, code: str, message: str):
    raise HTTPException(status, {"code": code, "message": message})


def _norm(c: str) -> int | str:
    return int(c) if c.isdigit() else c


def _answers(conn: sqlite3.Connection, aid: str) -> dict[str, int | str]:
    rows = conn.execute("SELECT question_id, choice FROM answers WHERE attempt_id=?", (aid,))
    return {r["question_id"]: _norm(r["choice"]) for r in rows}


def finalize(conn: sqlite3.Connection, a: dict, auto: bool) -> None:
    exam = Exam.model_validate_json(a["snapshot"])
    end = min(time.time(), a["expires_at"])
    result = json.dumps(evaluate(exam, _answers(conn, a["id"]), int(end - a["started_at"]), auto, topics()),
                        ensure_ascii=False)
    conn.execute("UPDATE attempts SET status='submitted', submitted_at=?, auto_submitted=?, result=? "
                 "WHERE id=? AND status='in_progress'", (end, int(auto), result, a["id"]))
    conn.commit()
    a.update(status="submitted", result=result)


def load(conn: sqlite3.Connection, aid: str) -> dict:
    row = conn.execute("SELECT * FROM attempts WHERE id=?", (aid,)).fetchone()
    if row is None:
        fail(404, "NOT_FOUND", "Attempt not found")
    a = dict(row)
    if a["status"] == "in_progress" and time.time() >= a["expires_at"]:
        finalize(conn, a, auto=True)
    return a


def payload(conn: sqlite3.Connection, a: dict) -> dict:
    exam = Exam.model_validate_json(a["snapshot"])
    labels = topics()
    return {"id": a["id"], "exam_id": exam.exam_id, "title": exam.title, "paper_label": exam.paper_label, "status": a["status"],
            "expires_at": a["expires_at"], "server_time": time.time(),
            "marks": {"correct": str(exam.marks_correct), "wrong": str(exam.marks_wrong),
                      "blank": str(exam.marks_blank), "decline": str(exam.marks_decline)},
            "questions": [{"id": q.id, "topic": q.topic, "topic_label": labels.get(q.topic, q.topic),
                           "question": q.question, "options": q.options,
                           "question_en": q.question_en, "options_en": q.options_en}
                          for q in exam.questions],
            "answers": _answers(conn, a["id"])}


def start(conn: sqlite3.Connection, exam: Exam) -> dict:
    row = conn.execute("SELECT id FROM attempts WHERE exam_id=? AND status='in_progress'",
                       (exam.exam_id,)).fetchone()
    if row:
        a = load(conn, row["id"])
        if a["status"] == "in_progress":
            return payload(conn, a)
    now, aid = time.time(), uuid.uuid4().hex
    try:
        conn.execute("INSERT INTO attempts(id, exam_id, started_at, expires_at, snapshot) VALUES(?,?,?,?,?)",
                     (aid, exam.exam_id, now, now + exam.duration_minutes * 60, exam.model_dump_json()))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.rollback()
        return start(conn, exam)
    return payload(conn, load(conn, aid))


def save_answer(conn: sqlite3.Connection, aid: str, qid: str, choice: str) -> None:
    a = load(conn, aid)
    if a["status"] != "in_progress":
        fail(410, "ATTEMPT_CLOSED", "This attempt has finished")
    if qid not in {q.id for q in Exam.model_validate_json(a["snapshot"]).questions}:
        fail(404, "NO_QUESTION", "Question not found")
    if choice not in VALID:
        fail(422, "BAD_CHOICE", "Choice must be 0-3 or E")
    try:
        conn.execute("INSERT INTO answers(attempt_id, question_id, choice, answered_at) VALUES(?,?,?,?)",
                     (aid, qid, choice, time.time()))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.rollback()
        prev = conn.execute("SELECT choice FROM answers WHERE attempt_id=? AND question_id=?",
                            (aid, qid)).fetchone()["choice"]
        if prev != choice:
            fail(409, "ALREADY_ANSWERED", "This answer is locked")


def history(conn: sqlite3.Connection) -> list[dict]:
    out = []
    for r in conn.execute("SELECT id FROM attempts ORDER BY started_at DESC LIMIT 30").fetchall():
        a = load(conn, r["id"])
        res = json.loads(a["result"]) if a["result"] else None
        out.append({"id": a["id"], "exam_id": a["exam_id"], "status": a["status"],
                    "title": json.loads(a["snapshot"])["title"], "started_at": a["started_at"],
                    "net": res and res["net"], "max": res and res["max"]})
    return out
