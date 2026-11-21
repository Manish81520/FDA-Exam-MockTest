import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import Icon from "../components/Icon";
import Palette from "../components/Palette";
import QuestionCard from "../components/QuestionCard";
import { clock } from "../format";
import { K } from "../i18n";
import type { Attempt, Choice } from "../types";

interface Props {
  attempt: Attempt;
  onDone: (id: string) => void;
  notify: (msg: string) => void;
}

export default function Exam({ attempt, onDone, notify }: Props) {
  const qs = attempt.questions;
  const offset = useRef(attempt.server_time - Date.now() / 1000).current;
  const remaining = () => Math.max(0, Math.ceil(attempt.expires_at - (Date.now() / 1000 + offset)));

  const firstOpen = qs.findIndex((q) => !(q.id in attempt.answers));
  const [ans, setAns] = useState<Record<string, Choice>>(attempt.answers);
  const [later, setLater] = useState<Set<string>>(() => new Set());
  const [cur, setCur] = useState(Math.max(0, firstOpen));
  const [sel, setSel] = useState<Choice | null>(null);
  const [busy, setBusy] = useState(false);
  const [sync, setSync] = useState<"ok" | "saving" | "error">("ok");
  const [confirm, setConfirm] = useState(firstOpen < 0);
  const [left, setLeft] = useState(remaining);
  const finishing = useRef(false);
  const warned = useRef(new Set<number>());
  const previousLeft = useRef(left);

  const nextOpen = (from: number, answered: Record<string, Choice> = ans) => {
    for (let k = 1; k <= qs.length; k++) {
      const i = (from + k + qs.length) % qs.length;
      if (!(qs[i].id in answered)) return i;
    }
    return -1;
  };
  const prevOpen = (from: number) => {
    for (let k = 1; k <= qs.length; k++) {
      const i = (((from - k) % qs.length) + qs.length) % qs.length;
      if (!(qs[i].id in ans)) return i;
    }
    return -1;
  };
  /** Move to question i. An unanswered question being left is automatically marked for review. */
  const go = (i: number, markLeft = true) => {
    if (i < 0) { setConfirm(true); return; }
    if (markLeft && i !== cur && !(qs[cur].id in ans)) setLater((s) => new Set(s).add(qs[cur].id));
    setCur(i);
    setSel(null);
  };

  async function finish(auto: boolean) {
    if (finishing.current) return;
    finishing.current = true;
    try {
      await api.submit(attempt.id);
    } catch {
      finishing.current = false;
      notify(K.saveFail);
      return;
    }
    if (auto) notify(K.autoSub);
    onDone(attempt.id);
  }

  async function save() {
    if (sel === null || busy || qs[cur].id in ans) return;
    const q = qs[cur];
    setBusy(true);
    setSync("saving");
    try {
      await api.answer(attempt.id, q.id, sel);
      const updated = { ...ans, [q.id]: sel };
      setAns(updated);
      setSync("ok");
      go(nextOpen(cur, updated), false);
    } catch (e) {
      if (e instanceof ApiError && e.status === 410) {
        void finish(true);
      } else if (e instanceof ApiError && e.status === 409) {
        try {
          const fresh = (await api.attempt(attempt.id)).answers;
          setAns(fresh);
          setSync("ok");
          go(nextOpen(cur, fresh), false);
        } catch { setSync("error"); notify(K.saveFail); }
      } else {
        setSync("error");
        notify(K.saveFail);
      }
    } finally {
      setBusy(false);
    }
  }

  const markLater = () => {
    setLater((s) => new Set(s).add(qs[cur].id));
    go(nextOpen(cur), false);
  };

  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    const id = window.setInterval(() => {
      const l = remaining();
      setLeft(l);
      if (l === 0) void finishRef.current(true);
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    for (const w of [600, 120]) {
      if (previousLeft.current > w && left > 0 && left <= w && !warned.current.has(w)) {
        warned.current.add(w);
        notify(K.timeWarn);
      }
    }
    previousLeft.current = left;
  }, [left, notify]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (confirm || e.ctrlKey || e.metaKey || e.altKey || t.tagName === "INPUT") return;
    const k = e.key.toLowerCase();
    const i = "1234".indexOf(k) >= 0 ? "1234".indexOf(k) : "abcd".indexOf(k);
    if (k.length === 1 && i >= 0) setSel(i);
    else if (k === "5" || k === "e") setSel("E");
    else if (k === "l") markLater();
    else if (k === "arrowright") go(nextOpen(cur));
    else if (k === "arrowleft") go(prevOpen(cur));
    else if (k === "enter" && t.tagName !== "BUTTON") void save();
  };
  const keyRef = useRef(onKey);
  keyRef.current = onKey;
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const unanswered = qs.filter((q) => !(q.id in ans)).length;
  const pct = Math.round(((qs.length - unanswered) / qs.length) * 100);
  const penalty = Math.abs(parseFloat(attempt.marks.blank));
  const timeParts = [
    Math.floor(left / 3600),
    Math.floor((left % 3600) / 60),
    left % 60,
  ];

  return (
    <>
      <div className="card xhead">
        <div className="xtitle">
          {attempt.paper_label && <span className="tag paper">{attempt.paper_label}</span>}
          <div>
            <h1>{attempt.title}</h1>
            <p className={`sync ${sync}`}><i className="dot" />{K.sync[sync]}</p>
          </div>
        </div>
        <div className="prog">
          <div className="row"><b>{K.q} {cur + 1} / {qs.length}</b><small>{pct}% {K.done}</small></div>
          <div className="bar"><i style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="clock">
          <div className={`clock-display${left <= 600 ? " low" : ""}`}
            role="timer" aria-label={`${K.timeLeft}: ${clock(left)}`}>
            {timeParts.map((part, index) => (
              <span className="clock-unit" key={index}>
                {index > 0 && <span className="clock-separator" aria-hidden="true"> : </span>}
                <span className="clock-value" aria-hidden="true">{String(part).padStart(2, "0")}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="banner"><Icon n="alert" size={16} /><b>{K.note}</b> {K.banner(penalty.toFixed(2))}</p>
      <div className="exam-grid">
        <QuestionCard q={qs[cur]} index={cur} marks={attempt.marks} sel={sel} busy={busy}
          onSelect={setSel} onSave={() => void save()} onLater={markLater} />
        <Palette questions={qs} answers={ans} later={later} current={cur} onJump={go} onSubmit={() => setConfirm(true)} />
      </div>
      {confirm && (
        <ConfirmDialog
          total={qs.length}
          unanswered={unanswered}
          penalty={penalty}
          onBack={unanswered > 0 ? () => { setConfirm(false); go(nextOpen(-1), false); } : undefined}
          onConfirm={() => void finish(false)}
        />
      )}
    </>
  );
}
