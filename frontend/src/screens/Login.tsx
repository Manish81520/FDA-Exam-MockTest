import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import { K } from "../i18n";

export default function Login({ onDone }: { onDone: () => void }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api.login(pass);
      onDone();
    } catch (x) {
      setErr(x instanceof ApiError && x.status === 401 ? K.badPass : (x as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <h1>{K.title}</h1>
      <form className="card" onSubmit={(e) => void submit(e)}>
        <input type="password" autoComplete="current-password" autoFocus required
          placeholder={K.pass} aria-label={K.pass} value={pass} onChange={(e) => setPass(e.target.value)} />
        <p className="warn" role="alert">{err}</p>
        <button className="btn pri" disabled={busy}>{K.login}</button>
      </form>
    </>
  );
}
