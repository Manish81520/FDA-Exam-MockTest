"""Pure scoring and topic analysis. All marks use Decimal."""
from collections import defaultdict
from decimal import Decimal

from .exams import Exam

CENT = Decimal("0.01")
WEAK_ACCURACY = Decimal("0.5")
MIN_TOPIC_QUESTIONS = 3
KINDS = ("correct", "wrong", "declined", "blank")


def fmt(d: Decimal) -> str:
    return str(d.quantize(CENT))


def outcome(correct_index: int, choice: int | str | None) -> str:
    if choice is None:
        return "blank"
    if choice == "E":
        return "declined"
    return "correct" if choice == correct_index else "wrong"


def evaluate(exam: Exam, answers: dict, elapsed: int, auto: bool, labels: dict[str, str]) -> dict:
    marks = {"correct": exam.marks_correct, "wrong": exam.marks_wrong,
             "blank": exam.marks_blank, "declined": exam.marks_decline}
    totals = dict.fromkeys(KINDS, 0)
    per_topic: dict[str, dict[str, int]] = defaultdict(lambda: {"total": 0, **dict.fromkeys(KINDS, 0)})
    review = []
    for q in exam.questions:
        choice = answers.get(q.id)
        kind = outcome(q.correct_index, choice)
        totals[kind] += 1
        per_topic[q.topic]["total"] += 1
        per_topic[q.topic][kind] += 1
        review.append({"id": q.id, "topic": q.topic, "question": q.question, "options": q.options,
                       "correct_index": q.correct_index, "explanation": q.explanation,
                       "choice": choice, "outcome": kind})

    net = sum((marks[k] * n for k, n in totals.items()), Decimal(0))
    maximum = exam.marks_correct * len(exam.questions)
    rows = []
    for key, t in per_topic.items():
        t_net = sum((marks[k] * t[k] for k in KINDS), Decimal(0))
        t_max = exam.marks_correct * t["total"]
        attempted = t["correct"] + t["wrong"]
        issue = max(("wrong", "blank", "declined"), key=lambda k: t[k])  # ties: wrong > blank > declined
        rows.append((t_net / t_max if t_max else Decimal(0), {
            "topic": key, "label": labels.get(key, key), **t,
            "net": fmt(t_net), "max": fmt(t_max),
            "accuracy": fmt(Decimal(t["correct"]) * 100 / t["total"]),
            "attempted_accuracy": fmt(Decimal(t["correct"]) * 100 / attempted) if attempted else None,
            "needs_improvement": t["total"] >= MIN_TOPIC_QUESTIONS
            and Decimal(t["correct"]) / t["total"] < WEAK_ACCURACY,
            "primary_issue": issue if t[issue] else None}))
    rows.sort(key=lambda r: r[0])

    saved_by_e = max(Decimal(0), (marks["declined"] - marks["blank"]) * totals["blank"])
    return {"net": fmt(net), "max": fmt(maximum), "percentage": fmt(net * 100 / maximum),
            "passed": None if exam.pass_marks is None else net >= exam.pass_marks,
            "counts": totals, "avoidable_blank_loss": fmt(saved_by_e),
            "elapsed_seconds": elapsed, "auto_submitted": auto,
            "topics": [r[1] for r in rows], "review": review}
