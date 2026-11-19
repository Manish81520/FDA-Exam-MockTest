import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import NavBar from "./components/NavBar";
import { useToast } from "./components/Toast";
import { K } from "./i18n";
import Exam from "./screens/Exam";
import History from "./screens/History";
import Home from "./screens/Home";
import Login from "./screens/Login";
import Result from "./screens/Result";
import type { Attempt } from "./types";

type View =
  | { name: "boot" }
  | { name: "login" }
  | { name: "home" }
  | { name: "history" }
  | { name: "exam"; attempt: Attempt }
  | { name: "result"; id: string };

export default function App() {
  const [view, setView] = useState<View>({ name: "boot" });
  const { notify, toast } = useToast();
  const goHome = useCallback(() => setView({ name: "home" }), []);
  const goPast = useCallback(() => setView({ name: "history" }), []);
  const goResult = useCallback((id: string) => setView({ name: "result", id }), []);
  const logout = () => { void api.logout().finally(() => setView({ name: "login" })); };

  useEffect(() => {
    api.me().then(goHome, () => setView({ name: "login" }));
    const lost = () => setView({ name: "login" });
    window.addEventListener("auth-lost", lost);
    return () => window.removeEventListener("auth-lost", lost);
  }, [goHome]);

  const active = view.name === "home" ? "home" : view.name === "exam" ? "exam" : "past";
  const authed = view.name !== "boot" && view.name !== "login";

  return (
    <>
      {authed && <NavBar active={active} onHome={goHome} onPast={goPast} onLogout={logout} />}
      <main className="shell">
        {view.name === "boot" && <p className="mut">{K.loading}</p>}
        {view.name === "login" && <Login onDone={goHome} />}
        {view.name === "home" && <Home notify={notify} onStart={(attempt) => setView({ name: "exam", attempt })} />}
        {view.name === "history" && <History notify={notify} onResult={goResult} />}
        {view.name === "exam" && (
          <Exam key={view.attempt.id} attempt={view.attempt} notify={notify} onDone={goResult} />
        )}
        {view.name === "result" && <Result id={view.id} notify={notify} onHome={goHome} />}
      </main>
      {toast}
      <footer className="foot">{K.footer}</footer>
    </>
  );
}
