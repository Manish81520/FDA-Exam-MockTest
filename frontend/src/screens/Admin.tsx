import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { api, ApiError, type AdminExam } from "../api";

type Mode = "checking" | "login" | "ready" | "disabled";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function examIdOf(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("exam_id" in value)) return null;
  return typeof value.exam_id === "string" ? value.exam_id : null;
}

export default function Admin() {
  const [mode, setMode] = useState<Mode>("checking");
  const [passcode, setPasscode] = useState("");
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const refreshExams = useCallback(async () => {
    setLoadingExams(true);
    try {
      setExams(await api.adminExams());
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setMode("login");
        setError("Your admin session expired. Please sign in again.");
      } else {
        setError(messageOf(e));
      }
    } finally {
      setLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.adminMe().then(() => {
      if (!active) return;
      setMode("ready");
      void refreshExams();
    }).catch((e: unknown) => {
      if (!active) return;
      if (e instanceof ApiError && e.status === 503) setMode("disabled");
      else setMode("login");
    });
    return () => { active = false; };
  }, [refreshExams]);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.adminLogin(passcode);
      setPasscode("");
      setMode("ready");
      await refreshExams();
    } catch (e) {
      setError(messageOf(e));
      if (e instanceof ApiError && e.status === 503) setMode("disabled");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await api.adminLogout();
      setMode("login");
      setExams([]);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError("Choose an exam JSON file first.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".json") || file.size > 5 * 1024 * 1024) {
      setError("Choose a JSON file smaller than 5 MB.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const exam: unknown = JSON.parse(await file.text());
      const examId = examIdOf(exam);
      const current = exams.find((item) => item.exam_id === examId);
      if (current && !window.confirm(`Replace "${current.title}" (${current.exam_id})?`)) return;
      const saved = await api.adminUpload(exam);
      setNotice(saved.replaced ? `Replaced "${saved.title}".` : `Added "${saved.title}".`);
      if (fileInput.current) fileInput.current.value = "";
      await refreshExams();
    } catch (e) {
      setError(e instanceof SyntaxError ? "The selected file is not valid JSON." : messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(exam: AdminExam) {
    if (!window.confirm(`Permanently remove "${exam.title}" (${exam.exam_id})?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.adminDelete(exam.exam_id);
      setNotice(`Removed "${exam.title}".`);
      await refreshExams();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="admin-header">
        <div>
          <strong>FDA Mock Exam</strong>
          <span>Admin console</span>
        </div>
        {mode === "ready" && (
          <button type="button" className="btn" disabled={busy} onClick={() => void signOut()}>
            Sign out
          </button>
        )}
      </header>
      <main className="shell admin-shell">
        {mode === "checking" && <p className="mut">Checking admin access…</p>}
        {mode === "disabled" && (
          <section className="card admin-card">
            <h1>Admin access is not configured</h1>
            <p>Set <code>ADMIN_PASSCODE</code> and a random <code>SECRET_KEY</code> of at least 32 characters on the server.</p>
          </section>
        )}
        {mode === "login" && (
          <section className="card admin-card admin-login">
            <h1>Admin sign in</h1>
            <p className="mut">This area is separate from candidate access.</p>
            <form onSubmit={(event) => void signIn(event)}>
              <label htmlFor="admin-passcode">Admin passcode</label>
              <input
                id="admin-passcode"
                type="password"
                autoComplete="current-password"
                required
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
              />
              <button type="submit" className="btn pri" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </section>
        )}
        {mode === "ready" && (
          <>
            <h1 className="page-title">Manage mock exams</h1>
            <section className="card admin-card">
              <h2>Add or replace an exam</h2>
              <p className="mut">
                Upload an exam JSON file. A matching <code>exam_id</code> replaces that exam;
                otherwise, a new exam is added. Changes are available immediately.
              </p>
              <form className="admin-upload" onSubmit={(event) => void upload(event)}>
                <label htmlFor="exam-json">Exam JSON file</label>
                <input
                  ref={fileInput}
                  id="exam-json"
                  type="file"
                  accept=".json,application/json"
                  required
                  disabled={busy}
                />
                <button type="submit" className="btn pri" disabled={busy}>
                  {busy ? "Working…" : "Upload exam"}
                </button>
              </form>
            </section>
            <section className="admin-list-section">
              <div className="row">
                <h2>Available exams</h2>
                <button type="button" className="btn" disabled={loadingExams || busy}
                  onClick={() => void refreshExams()}>
                  Refresh
                </button>
              </div>
              {loadingExams && <p className="mut">Loading exams…</p>}
              {!loadingExams && exams.length === 0 && <p className="card mut">No exams available.</p>}
              {exams.map((exam) => (
                <article className="card admin-exam" key={exam.exam_id}>
                  <div>
                    <h3>{exam.title}</h3>
                    <p className="mut">
                      ID: <code>{exam.exam_id}</code> · {exam.questions} questions · {exam.duration_minutes} min
                    </p>
                  </div>
                  <button type="button" className="btn admin-delete" disabled={busy}
                    onClick={() => void remove(exam)}>
                    Remove
                  </button>
                </article>
              ))}
            </section>
          </>
        )}
        {error && <p className="admin-message error" role="alert">{error}</p>}
        {notice && <p className="admin-message success" role="status">{notice}</p>}
      </main>
      <footer className="foot">Admin area · Candidate accounts cannot manage exams.</footer>
    </div>
  );
}
