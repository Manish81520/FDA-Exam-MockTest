import { useCallback, useRef, useState, type ReactNode } from "react";

export function useToast(): { notify: (msg: string) => void; toast: ReactNode } {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>();
  const notify = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 4500);
  }, []);
  const toast = msg ? <div className="toast" role="status">{msg}</div> : null;
  return { notify, toast };
}
