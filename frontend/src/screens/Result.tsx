import { useEffect, useState } from "react";
import { api } from "../api";
import { clock, LETTERS } from "../format";
import { K } from "../i18n";
import type { Outcome, Result as ResultData, ReviewItem } from "../types";

const NAMES: Record<Outcome, string> = {
  correct: K.right, wrong: K.wrong, declined: K.declined, blank: K.blank,
};
const ORDER: Outcome[] = ["correct", "wrong", "declined", "blank"];

function yourAnswer(x: ReviewItem): string {
  if (x.choice === null) return K.blank;
  if (x.choice === "E") return K.dec;
  return `${LETTERS[x.choice]}. ${x.options[x.choice]}`;
}

interface Props { id: string; onHome: () => void; notify: (msg: string) => void }

export default function Result({ id, onHome, notify }: Props) {
  const [r, setR] = useState<ResultData | null>(null);
  const [filter, setFilter] = useState<Outcome | "all">("all");

  useEffect(() => {
    let live = true;
    api.result(id)
      .then((d) => { if (live) setR(d); })
      .catch((e: Error) => { notify(e.message); onHome(); });
    return () => { live = false; };
  }, [id, notify, onHome]);

  if (!r) return <p className="mut">{K.loading}</p>;
  const review = r.review.filter((x) => filter === "all" || x.outcome === filter);

  return (
    <>
      <h1>{K.title}</h1>
      <section className="card">
        <p className="mut">{K.total2}</p>
        <div className="big">{r.net} / {r.max}</div>
        <p className="mut">
          {r.percentage}%{r.passed !== null && ` · ${r.passed ? K.passed : K.failed}`} · {clock(r.elapsed_seconds)}
        </p>
        {r.auto_submitted && <p className="warn">{K.autoSub}</p>}
        <div className="tiles">
          {ORDER.map((k) => (
            <div key={k}><b>{r.counts[k]}</b><span className="mut">{NAMES[k]}</span></div>
          ))}
        </div>
        {parseFloat(r.avoidable_blank_loss) > 0 && <p className="warn">{K.avoid(r.avoidable_blank_loss)}</p>}
      </section>

      <h2>{K.topics}</h2>
      {r.topics.map((t) => (
        <div className={`card${t.needs_improvement ? " weak" : ""}`} key={t.topic}>
          <div className="row"><b>{t.label}</b><span>{t.net} / {t.max}</span></div>
          <div className="bar"><i style={{ width: `${Math.max(0, parseFloat(t.accuracy))}%` }} /></div>
          <div className="mut">
            {K.right} {t.correct} · {K.wrong} {t.wrong} · {K.declined} {t.declined} · {K.blank} {t.blank}
          </div>
          {t.needs_improvement && (
            <p className="warn">{K.weak}. {t.primary_issue ? K.advice[t.primary_issue] : ""}</p>
          )}
        </div>
      ))}

      <div className="chips">
        {(["all", ...ORDER] as const).map((k) => (
          <button key={k} type="button" aria-pressed={filter === k}
            className={`btn${filter === k ? " pri" : ""}`} onClick={() => setFilter(k)}>
            {k === "all" ? K.all : NAMES[k]}
          </button>
        ))}
      </div>
      {review.map((x) => (
        <div className="card" key={x.id}>
          <p>{x.question}</p>
          <p className="mut">{K.yours}: {yourAnswer(x)}</p>
          <p>{K.correct}: {LETTERS[x.correct_index]}. {x.options[x.correct_index]}</p>
          {x.explanation && <p className="mut">{x.explanation}</p>}
        </div>
      ))}
      <p><button type="button" className="btn" onClick={onHome}>{K.home}</button></p>
    </>
  );
}
