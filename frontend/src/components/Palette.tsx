import { K } from "../i18n";
import type { Choice, Question } from "../types";
import Icon from "./Icon";

type State = "ok" | "e" | "later" | "cur" | "new";
interface Props {
  questions: Question[];
  answers: Record<string, Choice>;
  later: Set<string>;
  current: number;
  onJump: (index: number) => void;
  onSubmit: () => void;
}

export default function Palette({ questions, answers, later, current, onJump, onSubmit }: Props) {
  const stateOf = (q: Question, i: number): State => {
    if (q.id in answers) return answers[q.id] === "E" ? "e" : "ok";
    if (i === current) return "cur";
    return later.has(q.id) ? "later" : "new";
  };
  const states = questions.map(stateOf);
  const n = (...s: State[]) => states.filter((x) => s.includes(x)).length;
  const stats: [string, number, string][] = [
    [K.answered, n("ok", "e"), "ok"], [K.review, n("later"), "later"],
    [K.unvisited, n("new"), "new"], [K.eChoice, n("e"), "e"],
  ];
  const legend: [string, string][] = [
    [K.lgAnswered, "ok"], [K.review, "later"], [K.lgCurrent, "cur"], [K.eChoice, "e"], [K.unvisited, "new"],
  ];

  return (
    <aside className="card pal-card">
      <div className="row"><h2 className="ptitle"><Icon n="grid" />{K.palette}</h2><small className="mut">{K.total}: {questions.length}</small></div>
      <div className="stats">
        {stats.map(([label, count, s]) => (
          <div key={label}><span><i className={`dot s-${s}`} />{label}:</span><b>{count}</b></div>
        ))}
      </div>
      <p className="mut pick">{K.pick}</p>
      <div className="grid10">
        {questions.map((q, i) => (
          <button key={q.id} type="button" className={`t s-${states[i]}`} aria-label={`${K.q} ${i + 1}`}
            aria-current={i === current} disabled={states[i] === "ok" || states[i] === "e"} onClick={() => onJump(i)}>
            {i + 1}
          </button>
        ))}
      </div>
      {questions.length > 50 && <p className="mut scroll">{K.scroll(51, questions.length)}</p>}
      <div className="legend">
        {legend.map(([label, s]) => <span key={label}><i className={`dot s-${s}`} />{label}</span>)}
      </div>
      <button type="button" className="btn submit" onClick={onSubmit}><Icon n="clipboard" />{K.submitExam}</button>
      <p className="mut note">{K.submitNote}</p>
    </aside>
  );
}
