# Contract Intelligence & Approval Platform

AI-assisted contract review. A Supervisor Agent and a Workflow Orchestrator coordinate
nine specialist agents across eight stages, all reading and writing one shared Contract
Case object. Nothing is auto-approved: every case ends at human review.

Built to the uploaded master development prompt and SRS. Divergences and unresolved
questions are recorded in `docs/OPEN_DECISIONS.md`.

## Stack

SQLite by default for local development, Postgres in Docker Compose, ChromaDB, Groq via
LangChain, LangGraph, FastAPI, arq/Redis workers, React + Vite + Tailwind + MUI,
React Flow, Recharts, Tesseract, WeasyPrint.

## Prerequisites

You can run the app either directly on the host or through Docker Compose.

Host install (non-container):

- Python 3.12+ and Node 20+
- Redis, running locally - the worker queue and the live-status fanout both use it
- Tesseract OCR and Poppler, for scanned contracts
- Pango, Cairo and GDK-PixBuf, which WeasyPrint links against for PDF output

Debian/Ubuntu:

    sudo apt install redis-server tesseract-ocr poppler-utils \
        libpango-1.0-0 libpangoft2-1.0-0 libcairo2 libgdk-pixbuf-2.0-0

macOS:

    brew install redis tesseract poppler pango cairo gdk-pixbuf

## Running it

### Option A: local host development

Backend, from `backend/`:

    python -m venv .venv
    source .venv/bin/activate          # Windows: .venv\Scripts\activate
    pip install -r requirements.txt

    cp ../.env.example ../.env         # set GROQ_API_KEY and JWT_SECRET
    mkdir -p data

    alembic revision --autogenerate -m "initial"
    alembic upgrade head
    sqlite3 data/cip.db < ../infra/sqlite/audit_append_only.sql
    python -m app.seed

    uvicorn app.main:app --reload

The worker runs in a second terminal, same venv activated, from `backend/`:

    arq app.workers.tasks.WorkerSettings

Frontend, from `frontend/`:

    npm install
    npm run dev

Frontend on http://localhost:5173, API on http://localhost:8000, docs at `/docs`.

Sign in with the bootstrap admin from `.env`, then change that password.

### Option B: Docker Compose

From the repository root:

    docker compose up --build

This starts the backend, PostgreSQL, Redis and ChromaDB. The backend container runs
migrations and seeds the bootstrap admin automatically on startup.

Frontend on http://localhost:5000, API on http://localhost:8000, docs at `/docs`.

## Layout

    backend/app/
      agents/            one folder per agent: agent.py, prompt.md, schema.py
      orchestrator/      static stage graph, LangGraph builder, stage runner
      knowledge/         ChromaDB store, ingestion, the RAG service
      core/              JWT, RBAC policy checks, optimistic locking, audit, crypto
      storage/           local and S3 adapters behind one interface
      llm/               Groq client, schema-validated calls with repair retries
      api/routers/       auth, contracts, review, audit, internal, websocket
    frontend/src/
      pages/             login, dashboard, case workspace, audit, knowledge base
      components/sections/   the ten workspace sections

## How a case flows

Upload creates the Contract Case and enqueues a Supervisor scope pass, which sets the
review scope and selects Stage 3/4 agents. The pipeline then runs stages 1 to 7, with
stages 3 and 4 dispatching their agents concurrently. Every agent writes only its own
namespace, under optimistic locking, because parallel agents share one case. Stage 8
blocks until a reviewer with the right policy grant decides.

A failed agent retries three times with exponential backoff. On final failure the branch
halts, the case is flagged for human review with the reason recorded, and no report is
produced from partial data.

## Adding a role

Insert rows into `policies`. No code change - route guards read the table.
