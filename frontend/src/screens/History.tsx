import { useEffect, useState } from "react";
import { api } from "../api";
import { K } from "../i18n";
import type { HistoryItem } from "../types";

interface Props { onResult: (id: string) => void; notify: (msg: string) => void }

export default function History({ onResult, notify }: Props) {
  const [items, setItems] = useState<HistoryItem[] | null>(null);

  useEffect(() => {
    let live = true;
    api.history()
      .then((h) => { if (live) setItems(h.filter((x) => x.status === "submitted")); })
      .catch((e: Error) => notify(e.message));
    return () => { live = false; };
  }, [notify]);

  if (!items) return <p className="mut">{K.loading}</p>;
  return (
    <>
      <h1 className="page-title">{K.history}</h1>
      {items.length === 0 && <p className="mut">{K.empty}</p>}
      {items.map((h) => (
        <div className="card row" key={h.id}>
          <span>
            {h.title}<br />
            <span className="mut">{new Date(h.started_at * 1000).toLocaleString("kn-IN")} · {h.net} / {h.max}</span>
          </span>
          <button type="button" className="btn" onClick={() => onResult(h.id)}>{K.view}</button>
        </div>
      ))}
    </>
  );
}
