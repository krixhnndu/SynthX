"""Groq chat model factory (via LangChain)."""
import hashlib
import logging
from itertools import count
from threading import Lock

from langchain_groq import ChatGroq

from app.config import settings

log = logging.getLogger(__name__)

_key_counter = count()
_key_lock = Lock()


def _configured_keys() -> list[str]:
    raw = settings.groq_api_keys or settings.groq_api_key
    keys = [key.strip() for key in raw.split(",") if key.strip()]
    return keys


def _key_fingerprint(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:8]


def _next_key() -> tuple[str, int, int]:
    keys = _configured_keys()
    if not keys:
        return "", 0, 0
    with _key_lock:
        index = next(_key_counter) % len(keys)
    return keys[index], index + 1, len(keys)


def get_llm(temperature: float = 0.0, long_context: bool = False) -> ChatGroq:
    api_key, key_number, key_count = _next_key()
    if key_count > 1:
        log.info(
            "workflow trace event=groq_key_selected key=%s/%s fingerprint=%s",
            key_number, key_count, _key_fingerprint(api_key),
        )
    return ChatGroq(
        api_key=api_key,
        model=settings.groq_model_long_context if long_context else settings.groq_model,
        temperature=temperature,
        timeout=settings.llm_timeout_seconds,
        max_retries=0,  # retries are handled by app.llm.structured so we can log attempts
    )
