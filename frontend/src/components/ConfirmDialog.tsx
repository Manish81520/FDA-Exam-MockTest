import { useEffect, useRef } from "react";
import { K } from "../i18n";

interface Props {
  total: number;
  unanswered: number;
  penalty: number;
  onBack?: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({ total, unanswered, penalty, onBack, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); onBack?.(); }}>
      <p>{K.answered}: {total - unanswered} / {total}</p>
      {unanswered > 0 && (
        <p className="warn">{K.unanswered(unanswered, penalty.toFixed(2), (unanswered * penalty).toFixed(2))}</p>
      )}
      <div className="row">
        {onBack ? <button type="button" className="btn" onClick={onBack}>{K.back}</button> : <span />}
        <button type="button" className="btn pri" onClick={onConfirm}>{K.confirm}</button>
      </div>
    </dialog>
  );
}
