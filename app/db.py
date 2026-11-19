import sqlite3

from . import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS attempts(
  id TEXT PRIMARY KEY, exam_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at REAL NOT NULL, expires_at REAL NOT NULL, submitted_at REAL,
  auto_submitted INTEGER NOT NULL DEFAULT 0, snapshot TEXT NOT NULL, result TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS one_active ON attempts(exam_id) WHERE status='in_progress';
CREATE TABLE IF NOT EXISTS answers(
  attempt_id TEXT NOT NULL REFERENCES attempts(id), question_id TEXT NOT NULL,
  choice TEXT NOT NULL, answered_at REAL NOT NULL, PRIMARY KEY(attempt_id, question_id));
"""


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(config.DB_PATH, timeout=10, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init() -> None:
    conn = connect()
    conn.execute("PRAGMA journal_mode=WAL")
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()
