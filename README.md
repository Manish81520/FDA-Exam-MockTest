# FDA Mock Exam

A private mock-exam website with a FastAPI + SQLite backend and a React + TypeScript frontend. The candidate interface is in Kannada.

## What you need

- Python 3.11 or newer
- Node.js 18 or newer, with npm
- A terminal opened in the project folder

## First-time setup

Create and activate a Python virtual environment, then install the backend packages:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

Install the frontend packages and create the files the backend will serve:

```bash
cd frontend
npm install
npm run build
cd ..
```

The virtual environment keeps this app's Python packages separate from other Python projects. Activate it again with `source .venv/bin/activate` whenever you open a new terminal to run the backend.

## Configure your local `.env` file

The `.env` file stores settings used by the backend. It is ignored by Git so your passcodes and secret key are not committed. This project has a local `.env` file already; keep using it. For a fresh copy, create a blank `.env` file and add the settings below in your editor. Do not overwrite an existing `.env`.

```bash
touch .env
```

Open `.env` in your editor and set these values:

- `PASSCODE`: the passcode candidates enter to use the exam site.
- `ADMIN_PASSCODE`: a different, private passcode only you use to manage exams at `/admin`.
- `SECRET_KEY`: a random secret of at least 32 characters. Generate one with:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copy the printed value into `.env`. Never use the example passcodes or share/commit your real `.env`.

The remaining values are ready for local development:

- `DB_PATH=mock.db`: stores attempt history in the project folder.
- `EXAMS_DIR=data/exams`: reads exam JSON files from the project.
- `SECURE_COOKIES=0`: allows cookies over local HTTP. For a deployed HTTPS site, set this to `1`.
- `APP_ENV=development`: enables the local development configuration. Set this to `production` for a public deployment; the app then refuses to start with weak or missing passcodes, an invalid signing key, or insecure cookies.

### Load `.env` in your terminal

The app does not load `.env` automatically. Before starting the backend, open a terminal in the project folder and run:

```bash
source .venv/bin/activate
set -a
source .env
set +a
```

This makes the values available to the backend. Repeat these commands in every new terminal where you start the backend. The frontend does not need the passcodes.

On a hosting provider, do not upload your local `.env`. Set the same values in the provider's environment-variable or secrets settings instead. Also set `SECURE_COOKIES=1`, and configure `EXAMS_DIR` and `DB_PATH` to locations on persistent storage. Uploaded exams or attempt history may otherwise disappear during a redeploy.

## Run and deploy with Docker

Install Docker Desktop (or Docker Engine with the Compose plugin). Docker Compose reads the existing `.env` file in the project folder. Keep your current passcodes and secret; do not copy, replace, or commit this file.

Check that `.env` contains `PASSCODE`, `ADMIN_PASSCODE`, and `SECRET_KEY`. The candidate and admin passcodes must be different, and `SECRET_KEY` must be a random value of at least 32 characters. If you need to create or rotate a secret, generate one with:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Use the printed value to update `SECRET_KEY` in your existing `.env` only if needed. Never commit or upload `.env`.

Build the image and start the app:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f app
```

Open the site at <http://localhost:8001> and the admin screen at <http://localhost:8001/admin>. Port `8001` is the default to avoid common local port conflicts; set `PORT=8000` in `.env` if port `8000` is available. Press `Ctrl+C` to stop viewing logs; the app continues running. Stop the app with:

```bash
docker compose down
```

Compose creates a persistent Docker volume named `clean-data` (normally `fda-mock-exam_clean-data`). It stores SQLite attempt history and exams added through the admin screen. It starts empty: no attempts or exam papers are bundled in the image. Rebuilding or recreating the container does not erase this volume. To inspect volume names, run `docker volume ls`.

For a deployed site:

1. Provide Docker/Compose or build the image from this project using the included `Dockerfile`.
2. Set `APP_ENV=production`, separate random passcodes of at least 12 characters for `PASSCODE` and `ADMIN_PASSCODE`, and a random `SECRET_KEY` of at least 32 characters using your deployment platform's secret manager. Do not copy `.env` into a public image or repository.
3. Set `SECURE_COOKIES=1` when the app is served over HTTPS. Production mode checks this setting and refuses to start if it is disabled.
4. Persist `/data` using a durable volume or disk. It contains both `/data/mock.db` and `/data/exams`; losing it loses attempt history and admin-managed exam changes.
5. Route external traffic through an HTTPS reverse proxy or managed TLS ingress to container port `8000`. Do not expose a production login site over plain HTTP.
6. Configure the platform to honor the container health check and restart policy, or equivalent platform settings.

To publish a new image after changing the app, rebuild and recreate the service:

```bash
docker compose up --build -d
```

The current Compose file uses a new, empty `clean-data` volume so a fresh run starts without attempt history or exams. The earlier `fda-mock-exam_app-data` volume, if present, is left untouched and is not mounted by this Compose configuration. Do not use `docker compose down -v` unless you intentionally want to permanently delete the currently mounted database and uploaded exams.

## Run locally

### Option A: Run the built website and backend together

From the project folder, activate `.venv` and load `.env` as shown above. Build the frontend if you have not already done so. Then validate the included exam files and start the server:

```bash
python -m app.exams
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open:

- Candidate website: <http://localhost:8000>
- Admin screen: <http://localhost:8000/admin>

Stop the server with `Ctrl+C`.

### Option B: Run in development mode

Development mode runs the backend and frontend development server in two terminals. It supports live frontend updates while you edit the code.

**Terminal 1 — backend:** open the project folder, activate `.venv`, load `.env`, then run:

```bash
source .venv/bin/activate
set -a
source .env
set +a
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — frontend:** open the project folder, then run:

```bash
cd frontend
npm run dev
```

Open:

- Candidate website: <http://localhost:5173>
- Admin screen: <http://localhost:5173/admin>

The Vite development server forwards `/api` requests to the backend on port `8000`. Keep both terminals running. The backend's environment variables need to be set in Terminal 1; the frontend does not need the passcodes.

## Admin: add, replace, or remove exams

1. Configure `ADMIN_PASSCODE` and `SECRET_KEY` in the backend environment, and start or redeploy the app.
2. Open the admin URL above (or `https://<your-domain>/admin` after deployment).
3. Sign in with `ADMIN_PASSCODE`—not the candidate `PASSCODE`.
4. Choose an exam `.json` file and select **Upload exam**.
5. To add an exam, give it a new `exam_id`. To replace one, use the same `exam_id` as the existing exam and confirm the replacement.
6. To remove an exam, select **Remove** next to it and confirm.

There is no admin link in the candidate interface. Candidate sign-in does not grant admin access. Admin sign-in uses a separate HTTP-only cookie and expires after 8 hours. Changes appear in the candidate exam list without restarting the server. An attempt already in progress keeps its original exam snapshot.

Uploads must follow the exam JSON format and use topic keys from `data/topics.json`. Each question needs four options, a unique question `id`, and `correct_index` set to `0`, `1`, `2`, or `3`. The server rejects invalid topics and uploads larger than 5 MB.

## Add an exam from files (local development)

The project intentionally contains no bundled exam papers. To start using the site, sign in at `/admin` with `ADMIN_PASSCODE` and upload your own exam JSON. Alternatively, place your exam JSON in `data/exams/` for local development and validate the files:

```bash
python -m app.exams
```

Restart the backend to load file-based changes. On a deployed site, use the admin screen instead; uploaded changes become available without a restart.

Each exam must include an `exam_id`, title, duration, and at least one question. Every question needs a unique `id`, a known topic key from `data/topics.json`, four non-empty options, and a `correct_index` from `0` to `3`. Optional question fields include `question_en`, `options_en`, and `explanation`; option E ("don't know") is added by the app. Exam scoring fields can be set in the JSON; the defaults are +1 for correct, -0.25 for wrong or blank, and 0 for option E.

## Deployment checklist

- Build the frontend with `cd frontend && npm ci && npm run build`.
- Set `APP_ENV=production` and separate, random passcodes of at least 12 characters for `PASSCODE` and `ADMIN_PASSCODE` in your host's secret settings.
- Generate and set a random `SECRET_KEY` of at least 32 characters.
- Set `SECURE_COOKIES=1` and serve through HTTPS.
- Mount a persistent, writable directory and set `EXAMS_DIR` to it.
- Keep `data/topics.json` deployed; uploaded questions must reference its topic keys.
- Make sure the deployment platform keeps the service running and forwards web traffic to the configured Uvicorn port.
- For Docker deployments, persist `/data`, set secrets in the platform, enable secure cookies behind HTTPS, and use the provided Compose health check.

Do not expose the site publicly without HTTPS and strong secrets. If your hosting provider does not provide persistent storage, uploaded exams may disappear when the service is replaced or redeployed.

## Project notes

- Attempt history and answers are stored in SQLite at `mock.db` by default. Set `DB_PATH` to a persistent disk path when deploying if you need that data to survive redeployments.
- Fonts (Noto Serif and Noto Serif Kannada) are bundled through npm, so Kannada rendering does not rely on fonts installed on the user's device.
- Kannada UI strings are in `frontend/src/i18n.ts`; a native speaker should review them before public use.
- "Look later" marks are stored in the browser; locked answers are stored on the server.
