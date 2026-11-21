import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import Icon from "../components/Icon";
import RichText from "../components/RichText";
import { clock, LETTERS } from "../format";
import { K } from "../i18n";
import type { Attempt, Outcome, Question, Result as ResultData, ReviewItem } from "../types";

const NAMES: Record<Outcome, string> = {
  correct: K.right, wrong: K.wrong, declined: K.declined, blank: K.blank,
};
const ENGLISH_NAMES: Record<Outcome, string> = {
  correct: "Correct", wrong: "Incorrect", declined: "Not sure", blank: "Unanswered",
};
const ORDER: Outcome[] = ["correct", "wrong", "declined", "blank"];

function answerLabel(x: ReviewItem, question?: Question) {
  if (x.choice === null) return K.blank;
  if (x.choice === "E") return `E. ${K.dec}`;
  return <>{LETTERS[x.choice]}. <RichText content={question?.options_en[x.choice] || x.options[x.choice]} /></>;
}

function money(value: number): string {
  return value.toFixed(2);
}

interface Props { id: string; onHome: () => void; notify: (msg: string) => void }

export default function Result({ id, onHome, notify }: Props) {
  const [r, setR] = useState<ResultData | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [filter, setFilter] = useState<Outcome | "all">("all");

  useEffect(() => {
    let live = true;
    Promise.all([api.result(id), api.attempt(id)])
      .then(([result, attemptData]) => {
        if (live) {
          setR(result);
          setAttempt(attemptData);
        }
      })
      .catch((e: Error) => { notify(e.message); onHome(); });
    return () => { live = false; };
  }, [id, notify, onHome]);

  const questionById = useMemo(
    () => new Map(attempt?.questions.map((question) => [question.id, question]) ?? []),
    [attempt],
  );

  if (!r || !attempt) return <p className="mut">{K.loading}</p>;

  const review = r.review.filter((x) => filter === "all" || x.outcome === filter);
  const percentage = Math.min(100, Math.max(0, Number(r.percentage) || 0));
  const attempted = r.counts.correct + r.counts.wrong;
  const attemptedAccuracy = attempted ? (r.counts.correct * 100) / attempted : null;
  const totalQuestions = r.review.length;
  const marks: Record<Outcome, number> = {
    correct: Number(attempt.marks.correct),
    wrong: Number(attempt.marks.wrong),
    declined: Number(attempt.marks.decline),
    blank: Number(attempt.marks.blank),
  };
  const contributions: Record<Outcome, number> = {
    correct: r.counts.correct * marks.correct,
    wrong: r.counts.wrong * marks.wrong,
    declined: r.counts.declined * marks.declined,
    blank: r.counts.blank * marks.blank,
  };

  const downloadResult = () => {
    const previousFilter = filter;
    const previousTitle = document.title;
    setFilter("all");
    document.title = `${attempt.title} - Result`;

    const restorePage = () => {
      document.title = previousTitle;
      setFilter(previousFilter);
    };
    window.addEventListener("afterprint", restorePage, { once: true });
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
  };

  return (
    <div className="result-page">
      <header className="result-heading">
        <div>
          <p className="result-eyebrow">MOCK EXAM · ಫಲಿತಾಂಶ</p>
          <h1>{K.title}</h1>
          <p className="mut">ನಿಮ್ಮ ಪರೀಕ್ಷೆಯ ಸಾಧನೆ ಮತ್ತು ಉತ್ತರಗಳ ವಿವರ</p>
        </div>
        <div className="result-actions">
          <button type="button" className="btn pri" onClick={downloadResult}>
            <Icon n="download" size={17} />Download result (PDF)
          </button>
          <button type="button" className="btn result-home" onClick={onHome}>{K.home}</button>
        </div>
      </header>

      <section className="result-hero card" aria-label="Overall exam result">
        <div className="result-score-ring" role="progressbar"
          aria-label={`Score ${r.percentage}%`} aria-valuenow={percentage}
          aria-valuemin={0} aria-valuemax={100}
          style={{ background: `conic-gradient(var(--acc) ${percentage}%, #e8eaf0 0)` }}>
          <div className="result-score-ring-center">
            <strong>{r.percentage}%</strong>
            <span>Overall score</span>
          </div>
        </div>
        <div className="result-hero-copy">
          <div className="result-status-row">
            <span className={`result-status${r.passed === false ? " is-failed" : ""}`}>
              {r.passed === null ? "RESULT" : r.passed ? "PASSED · ಉತ್ತೀರ್ಣ" : "NOT PASSED · ಅನುತ್ತೀರ್ಣ"}
            </span>
            {r.auto_submitted && <span className="result-auto">{K.autoSub}</span>}
          </div>
          <h2>{attempt.title}</h2>
          {attempt.paper_label && <p className="mut">{attempt.paper_label}</p>}
          <div className="result-hero-facts">
            <div><span>Net score · ಒಟ್ಟು ಅಂಕ</span><strong>{r.net} <i>/ {r.max}</i></strong></div>
            <div><span>Time taken · ಸಮಯ</span><strong>{clock(r.elapsed_seconds)}</strong></div>
            <div><span>Questions · ಪ್ರಶ್ನೆಗಳು</span><strong>{totalQuestions}</strong></div>
          </div>
        </div>
      </section>

      <section className="result-section">
        <div className="result-section-heading">
          <div><h2>Score breakdown</h2><p className="mut">ಅಂಕಗಳ ವಿವರ</p></div>
          <span className="result-section-note">Based on this exam's marking scheme</span>
        </div>
        <div className="result-outcome-grid">
          {ORDER.map((key) => (
            <article className={`result-outcome-card outcome-${key}`} key={key}>
              <span className="result-outcome-dot" aria-hidden="true" />
              <div className="result-outcome-label">
                <strong>{NAMES[key]}</strong><span>{ENGLISH_NAMES[key]}</span>
              </div>
              <strong className="result-outcome-count">{r.counts[key]}</strong>
              <div className="result-outcome-marks">
                <span>{r.counts[key]} × {money(Math.abs(marks[key]))} marks</span>
                <b>{money(Math.abs(contributions[key]))} {marks[key] < 0 ? "deducted" : "earned"}</b>
              </div>
            </article>
          ))}
        </div>
        <p className="result-arithmetic">
          {ORDER.map((key, index) => (
            <span key={key}>
              <b aria-hidden="true">{index === 0 ? (marks[key] < 0 ? "− " : "") : marks[key] < 0 ? " − " : " + "}</b>
              <span>{r.counts[key]} × {money(Math.abs(marks[key]))}</span>
            </span>
          ))}
          <b className="result-equals"> = {r.net} / {r.max}</b>
          <span className="mut"> Net score</span>
        </p>
        <p className="result-percentage-formula">
          Percentage = (net marks ÷ maximum marks) × 100 = ({r.net} ÷ {r.max}) × 100 = <b>{r.percentage}%</b>
        </p>
      </section>

      <section className="result-section">
        <div className="result-section-heading">
          <div><h2>Accuracy &amp; opportunities</h2><p className="mut">ನಿಖರತೆ ಮತ್ತು ಸುಧಾರಣೆಯ ಅವಕಾಶಗಳು</p></div>
        </div>
        <div className="result-accuracy-grid">
          <article className="result-panel card">
            <div className="result-panel-top"><span>Overall accuracy</span><b>{r.counts.correct} / {totalQuestions}</b></div>
            <p className="mut">All questions · ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳು</p>
            <div className="result-track"><i style={{ width: `${totalQuestions ? (r.counts.correct / totalQuestions) * 100 : 0}%` }} /></div>
            <strong className="result-accuracy-value">{totalQuestions ? `${((r.counts.correct / totalQuestions) * 100).toFixed(1)}%` : "—"}</strong>
          </article>
          <article className="result-panel card">
            <div className="result-panel-top"><span>Attempted accuracy</span><b>{r.counts.correct} / {attempted}</b></div>
            <p className="mut">Answered choices · ಉತ್ತರಿಸಿದ ಪ್ರಶ್ನೆಗಳು</p>
            <div className="result-track"><i style={{ width: `${attemptedAccuracy ?? 0}%` }} /></div>
            <strong className="result-accuracy-value">{attemptedAccuracy === null ? "—" : `${attemptedAccuracy.toFixed(1)}%`}</strong>
          </article>
        </div>
        {Number(r.avoidable_blank_loss) > 0 && (
          <aside className="result-avoidable">
            <span className="result-avoidable-mark" aria-hidden="true">!</span>
            <div><strong>Avoidable score loss · ತಪ್ಪಿಸಬಹುದಾದ ಅಂಕ ನಷ್ಟ</strong>
              <p>{K.avoid(r.avoidable_blank_loss)}</p></div>
            <b>−{r.avoidable_blank_loss}</b>
          </aside>
        )}
      </section>

      <section className="result-section">
        <div className="result-section-heading">
          <div><h2>{K.topics}</h2><p className="mut">Topic-wise performance · ವಿಷಯವಾರು ಸಾಧನೆ</p></div>
          <span className="result-section-note">Sorted by accuracy</span>
        </div>
        <div className="result-topic-list">
          {r.topics.map((topic) => {
            const accuracy = Math.min(100, Math.max(0, Number(topic.accuracy) || 0));
            return (
              <article className={`result-topic card${topic.needs_improvement ? " is-weak" : ""}`} key={topic.topic}>
                <div className="result-topic-main">
                  <div className="result-topic-title">
                    <div><h3>{topic.label}</h3><span>{topic.total} questions</span></div>
                    <span className={`result-topic-badge${topic.needs_improvement ? " is-weak" : ""}`}>
                      {topic.needs_improvement ? K.weak : "On track"}
                    </span>
                  </div>
                  <div className="result-track"><i style={{ width: `${accuracy}%` }} /></div>
                  <div className="result-topic-stats">
                    <span>{K.right} <b>{topic.correct}</b></span>
                    <span>{K.wrong} <b>{topic.wrong}</b></span>
                    <span>{K.declined} <b>{topic.declined}</b></span>
                    <span>{K.blank} <b>{topic.blank}</b></span>
                  </div>
                </div>
                <div className="result-topic-score">
                  <strong>{accuracy.toFixed(1)}<small>%</small></strong>
                  <span>{topic.net} / {topic.max} marks</span>
                </div>
                {topic.needs_improvement && topic.primary_issue && (
                  <p className="result-topic-advice">{K.advice[topic.primary_issue]}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="result-section result-review-section">
        <div className="result-section-heading">
          <div><h2>Question review</h2><p className="mut">ಪ್ರಶ್ನೆ ಮತ್ತು ಉತ್ತರಗಳ ಪರಿಶೀಲನೆ</p></div>
          <span className="result-section-note">{review.length} of {totalQuestions} questions</span>
        </div>
        <div className="result-filters" aria-label="Filter questions by result">
          {(["all", ...ORDER] as const).map((key) => {
            const count = key === "all" ? totalQuestions : r.counts[key];
            const label = key === "all" ? "All questions" : ENGLISH_NAMES[key];
            return (
              <button key={key} type="button" aria-pressed={filter === key}
                className={`result-filter${filter === key ? " is-active" : ""}`}
                onClick={() => setFilter(key)}>
                {label}<span>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="result-question-list">
          {review.length === 0 && <p className="result-empty">No questions in this category.</p>}
          {review.map((item) => {
            const question = questionById.get(item.id);
            const questionText = question?.question_en || item.question;
            const topicLabel = question?.topic_label || item.topic;
            return (
              <article className={`result-question card outcome-${item.outcome}`} key={item.id}>
                <div className="result-question-head">
                  <span className="result-question-number">Question {r.review.indexOf(item) + 1}</span>
                  <span className="result-question-topic">{topicLabel}</span>
                  <span className={`result-question-status outcome-${item.outcome}`}>{ENGLISH_NAMES[item.outcome]}</span>
                </div>
                <div className="result-question-prompt"><RichText content={questionText} /></div>
                {question?.question_en && question.question_en !== item.question && (
                  <div className="result-question-kannada"><RichText content={item.question} /></div>
                )}
                <div className="result-answer-summary">
                  <div><span>Your answer · ನಿಮ್ಮ ಉತ್ತರ</span><strong>{answerLabel(item, question)}</strong></div>
                  <div><span>Correct answer · ಸರಿಯಾದ ಉತ್ತರ</span>
                    <strong>{LETTERS[item.correct_index]}. <RichText content={question?.options_en[item.correct_index] || item.options[item.correct_index]} /></strong>
                  </div>
                </div>
                <div className="result-options">
                  {item.options.map((option, optionIndex) => {
                    const selected = item.choice === optionIndex;
                    const correct = item.correct_index === optionIndex;
                    const englishOption = question?.options_en[optionIndex];
                    return (
                      <div className={`result-option${correct ? " is-correct" : ""}${selected && !correct ? " is-selected-wrong" : ""}`}
                        key={`${item.id}-${optionIndex}`}>
                        <span className="result-option-letter">{LETTERS[optionIndex]}</span>
                        <div><span><RichText content={englishOption || option} /></span>
                          {englishOption && englishOption !== option && <small><RichText content={option} /></small>}</div>
                        {correct && <b>Correct</b>}
                        {selected && !correct && <b>Your choice</b>}
                      </div>
                    );
                  })}
                </div>
                {item.explanation && (
                  <div className="result-explanation"><strong>Explanation · ವಿವರಣೆ</strong><div><RichText content={item.explanation} /></div></div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
