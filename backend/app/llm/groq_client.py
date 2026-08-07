"""Groq chat model factory (via LangChain)."""
from langchain_groq import ChatGroq

from app.config import settings


def get_llm(temperature: float = 0.0, long_context: bool = False) -> ChatGroq:
    return ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model_long_context if long_context else settings.groq_model,
        temperature=temperature,
        timeout=settings.llm_timeout_seconds,
        max_retries=0,  # retries are handled by app.llm.structured so we can log attempts
    )
