import { LETTERS, signed } from "../format";
import { K } from "../i18n";
import type { Choice, Marks, Question } from "../types";
import Icon from "./Icon";
import RichText from "./RichText";

interface Props {
  q: Question;
  index: number;
  marks: Marks;
  sel: Choice | null;
  busy: boolean;
  onSelect: (c: Choice) => void;
  onSave: () => void;
  onLater: () => void;
}

export default function QuestionCard({ q, index, marks, sel, busy, onSelect, onSave, onLater }: Props) {
  const option = (key: Choice, badge: string, extra?: string) => (
    <button key={String(key)} type="button" role="radio" aria-checked={sel === key}
      className={`opt${sel === key ? " on" : ""}${key === "E" ? " e" : ""}`} onClick={() => onSelect(key)}>
      <span className="badge">{badge}</span>
      <span className="otext">
        {key === "E"
          ? <><b>{K.dec}</b><em className="tag">Option E</em><small>{K.eNote(signed(marks.decline).replace("+", ""))}</small></>
          : <><RichText content={q.options[key as number]} />{extra && <> (<RichText content={extra} />)</>}</>}
      </span>
      <span className="radio">{sel === key && <Icon n="check" size={14} />}</span>
    </button>
  );

  return (
    <section className="card qcard">
      <div className="qtop">
        <span className="qnum">{index + 1}</span>
        <span className="topic">{q.topic_label}</span>
        <span className="marks">
          <em className="c ok">{signed(marks.correct)} {K.right}</em>
          <em className="c bad">{signed(marks.wrong)} {K.wrong}</em>
          <em className="c grey">{signed(marks.blank)} {K.blankShort}</em>
        </span>
      </div>
      <div className="qtext">{index + 1}. <RichText content={q.question} /></div>
      {q.question_en && <div className="qen"><RichText content={q.question_en} /></div>}
      <div className="opts" role="radiogroup">
        {q.options.map((_, i) => option(i, LETTERS[i], q.options_en[i]))}
        <div className="divider"><span>{K.eDivider}</span></div>
        {option("E", "E")}
      </div>
      <div className="actions">
        <button type="button" className="btn soft" onClick={onLater}><Icon n="bookmark" />{K.later}</button>
        <div className="save">
          <button type="button" className="btn pri" disabled={sel === null || busy} onClick={onSave}>
            {K.save}<Icon n="arrow" />
          </button>
          <p className="lock"><Icon n="lock" size={13} />{K.lockNote}</p>
        </div>
      </div>
      <p className="keys">
        {K.keyboard} <code>{K.keyPick}</code> {K.keyPickT} · <code>Enter</code> {K.keySaveT} · <code>L</code> {K.keyLaterT} · <code>← / →</code> {K.keyMoveT}
      </p>
    </section>
  );
}
