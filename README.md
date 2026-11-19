# FDA Mock Exam (private)

Stack: FastAPI + SQLite backend, React + TypeScript + Vite frontend. Kannada UI.

## Run (production-style, one process)
    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    (cd frontend && npm install && npm run build)
    export PASSCODE=yourpass SECRET_KEY=$(python -c "import secrets;print(secrets.token_hex(32))")
    python -m app.exams                      # validate exam JSON
    uvicorn app.main:app --port 8000         # open http://localhost:8000

## Develop
Terminal 1: `uvicorn app.main:app --reload --port 8000`. Terminal 2: `cd frontend && npm run dev` (Vite proxies /api).

## Add an exam
Copy data/exams/sample-paper1.json, edit, run `python -m app.exams`, restart the server. Each question: 4 options (optional question_en / options_en for the English line, and paper_label on the exam), correct_index 0-3, a topic key from data/topics.json. Option E ("don't know") is added by the app. Marks (+1 / -0.25 / blank -0.25 / E 0) are set per exam in the JSON.

## Hosting privately
Set SECURE_COOKIES=1 and serve over HTTPS (Cloudflare Tunnel, Tailscale or a reverse proxy). Only the passcode protects the site.

## Notes
- Fonts (Noto Serif + Noto Serif Kannada) are bundled through npm (@fontsource), so Kannada renders the same on every device.
- Kannada UI strings live in frontend/src/i18n.ts; a native speaker should review them.
- "Look later" marks are kept in the browser only; locked answers are stored on the server.
