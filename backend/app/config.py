"""Application settings. All secrets come from environment variables (spec 12)."""
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings

# Repo-root .env. Resolved from this file's path, not the CWD, so the settings load
# the same file whether uvicorn/alembic run from backend/ or the repo root.
REPO_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"

# Where the app's local data lives (database, Chroma, uploaded documents). Anchored
# to backend/ so it is identical no matter which directory the process is launched
# from - a relative "./data/..." would otherwise point at a different folder per CWD.
BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    # --- Core ---
    app_name: str = "Contract Intelligence & Approval Platform"
    environment: str = "development"
    api_prefix: str = ""

    # --- Database (SQLite) ---
    database_url: str = "sqlite+pysqlite:///./data/cip.db"

    # --- Auth ---
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 480

    # --- Bootstrap admin (seed) ---
    bootstrap_admin_email: str = "admin@example.com"
    bootstrap_admin_password: str = "changeme123"

    # --- LLM (Groq) ---
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_model_long_context: str = "llama-3.3-70b-versatile"
    llm_timeout_seconds: int = 120
    llm_max_retries: int = 3
    llm_schema_retries: int = 2

    # --- Vector store (ChromaDB, decided) ---
    chroma_backend: str = "embedded"        # embedded | http (external server, multi-instance)
    chroma_persist_dir: str = "./data/chroma"
    chroma_collection: str = "legal_knowledge"
    chroma_host: str = "localhost"
    chroma_port: int = 8000
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    rag_top_k: int = 5

    # --- Object storage (adapter: local dev, S3 prod) ---
    storage_backend: str = "local"          # local | s3
    storage_local_dir: str = "./data/documents"
    s3_bucket: str = ""
    s3_region: str = "ap-south-1"

    # --- Redis / queue / websocket fanout ---
    redis_url: str = "redis://localhost:6379/0"

    # --- Orchestrator ---
    node_max_retries: int = 3
    node_backoff_base_seconds: float = 2.0
    # Stages 3 & 4 dispatch their agents concurrently by default. On a rate-limited
    # LLM tier, parallel agents exhaust the per-minute token budget and fail; set
    # PARALLEL_STAGES=false to run them serially instead (slower, fits the quota).
    parallel_stages: bool = True

    @field_validator("database_url")
    @classmethod
    def _anchor_database_url(cls, v: str) -> str:
        # sqlite+pysqlite:///./data/cip.db resolves "./" against the CWD, so the DB
        # file (and the login/session data in it) depends on where the process starts.
        # Rewrite relative sqlite URLs to an absolute path under backend/.
        prefix = "sqlite+pysqlite:///"
        if v.startswith(prefix) and v[len(prefix):].startswith("./"):
            rel = v[len(prefix) + 2:]
            return prefix + (BACKEND_DIR / rel).as_posix()
        return v

    @field_validator("chroma_persist_dir", "storage_local_dir")
    @classmethod
    def _anchor_data_dir(cls, v: str) -> str:
        # Same idea as above for the plain directory settings.
        if v.startswith("./"):
            return str(BACKEND_DIR / v[2:])
        return v

    class Config:
        env_file = str(REPO_ENV_FILE)
        env_prefix = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
