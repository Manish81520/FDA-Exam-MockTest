import { useEffect, useState } from "react";
import { api } from "../api";
import { K } from "../i18n";
import type { Attempt, ExamInfo, HistoryItem } from "../types";

interface Props {
  onStart: (attempt: Attempt) => void;
  notify: (msg: string) => void;
}

export default function Home({ onStart, notify }: Props) {
  const [data, setData] = useState<{ exams: ExamInfo[]; hist: HistoryItem[] } | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([api.exams(), api.history()])
      .then(([exams, hist]) => { if (live) setData({ exams, hist }); })
      .catch((e: Error) => notify(e.message));
    return () => { live = false; };
  }, [notify]);

  async function start(examId: string) {
    setStarting(examId);
    try {
      onStart(await api.start(examId));
    } catch (e) {
      setStarting(null);
      notify((e as Error).message);
    }
  }

  if (!data) return <p className="mut">{K.loading}</p>;
  const active = (id: string) => data.hist.some((h) => h.exam_id === id && h.status === "in_progress");

  return (
    <>
      <h1 className="page-title">{K.navExams}</h1>
      {data.exams.map((e) => (
        <section className="card" key={e.exam_id}>
          <h2>{e.title}</h2>
          <p className="mut">{e.questions} {K.questions} · {e.duration_minutes} {K.min}</p>
          <p className="mut">{K.rules(e.marks)}</p>
          <p className="gap">
            <button type="button" className="btn pri" disabled={starting !== null} onClick={() => void start(e.exam_id)}>
              {active(e.exam_id) ? K.resume : K.start}
            </button>
          </p>
        </section>
      ))}
    </>
  );
}
