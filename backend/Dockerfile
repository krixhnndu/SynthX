# syntax=docker/dockerfile:1.7
# ─── Stage 1: deps ────────────────────────────────────────────────────────────
FROM python:3.12-slim AS deps

WORKDIR /app

# System libs
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        libmagic1 \
        poppler-utils \
        tesseract-ocr

COPY requirements.txt .

ENV PIP_NO_CACHE_DIR=0

# Step 1: Install CPU-only torch first so sentence-transformers doesn't pull in 4GB of CUDA/nvidia wheels (no GPU inside Docker).
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install torch==2.2.2 --index-url https://download.pytorch.org/whl/cpu

# Step 2: Install everything else (sentence-transformers will reuse the CPU torch above)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# ─── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Runtime system libs only (no build-essential)
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        libmagic1 \
        poppler-utils \
        tesseract-ocr

# Copy installed packages from deps stage
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy app source last — only this layer rebuilds on code changes
COPY . .

RUN mkdir -p data/chroma data/documents

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
