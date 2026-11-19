"""Exam file models and validation. Run `python -m app.exams` to validate all files."""
import json
import unicodedata
from decimal import Decimal
from functools import cache

from pydantic import BaseModel, Field, field_validator, model_validator

from . import config


class Question(BaseModel):
    id: str = Field(min_length=1)
    topic: str
    question: str = Field(min_length=1)
    options: list[str]
    correct_index: int = Field(ge=0, le=3)
    explanation: str = ""
    question_en: str = ""
    options_en: list[str] = Field(default_factory=list)

    @field_validator("options_en")
    @classmethod
    def _options_en(cls, v: list[str]) -> list[str]:
        if v and len(v) != 4:
            raise ValueError("options_en must be empty or have exactly 4 items")
        return v

    @field_validator("question", "explanation")
    @classmethod
    def _nfc(cls, v: str) -> str:
        return unicodedata.normalize("NFC", v)

    @field_validator("options")
    @classmethod
    def _options(cls, v: list[str]) -> list[str]:
        if len(v) != 4 or not all(o.strip() for o in v):
            raise ValueError("exactly 4 non-empty options are required")
        return [unicodedata.normalize("NFC", o) for o in v]


class Exam(BaseModel):
    exam_id: str = Field(min_length=1)
    title: str
    description: str = ""
    paper_label: str = ""
    duration_minutes: int = Field(gt=0)
    marks_correct: Decimal = Decimal("1")
    marks_wrong: Decimal = Decimal("-0.25")
    marks_blank: Decimal = Decimal("-0.25")
    marks_decline: Decimal = Decimal("0")
    pass_marks: Decimal | None = None
    questions: list[Question] = Field(min_length=1)

    @model_validator(mode="after")
    def _unique_ids(self) -> "Exam":
        ids = [q.id for q in self.questions]
        if len(ids) != len(set(ids)):
            raise ValueError("duplicate question ids")
        return self


@cache
def topics() -> dict[str, str]:
    return json.loads((config.DATA / "topics.json").read_text("utf-8"))


def load_exams() -> dict[str, Exam]:
    known, out = topics(), {}
    for path in sorted(config.EXAMS_DIR.glob("*.json")):
        try:
            exam = Exam.model_validate_json(path.read_text("utf-8"))
        except ValueError as e:
            raise ValueError(f"{path.name}: {e}") from e
        bad = {q.topic for q in exam.questions} - known.keys()
        if bad:
            raise ValueError(f"{path.name}: unknown topics {sorted(bad)}")
        if exam.exam_id in out:
            raise ValueError(f"{path.name}: duplicate exam_id {exam.exam_id}")
        out[exam.exam_id] = exam
    return out


if __name__ == "__main__":
    loaded = load_exams()
    print(f"OK: {len(loaded)} exam(s) valid: {', '.join(loaded)}")
