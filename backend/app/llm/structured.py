"""Schema-validated LLM calls.

The master prompt's retry policy only covers transient failure. A model returning
well-formed JSON that violates the namespace schema is a third failure mode, so it
gets its own bounded repair loop here (docs/OPEN_DECISIONS.md, gap 5).
"""
import asyncio
import json
import logging
from typing import Type, TypeVar

from pydantic import BaseModel, ValidationError

from app.config import settings
from app.llm.groq_client import get_llm

log = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)

REPAIR_INSTRUCTION = (
    "Your previous response did not match the required schema. "
    "Validation errors:\n{errors}\n"
    "Return corrected JSON only. No prose, no markdown fences."
)


def _extract_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
    return text.strip().strip("`").strip()


async def call_structured(
    system_prompt: str,
    user_content: str,
    output_model: Type[T],
    *,
    temperature: float = 0.0,
    long_context: bool = False,
) -> T:
    llm = get_llm(temperature=temperature, long_context=long_context)
    schema_hint = json.dumps(output_model.model_json_schema(), indent=2)
    messages = [
        ("system", f"{system_prompt}\n\nRespond with JSON matching this schema:\n{schema_hint}\n"
                   f"Output raw JSON only - no markdown fences, no commentary."),
        ("human", user_content),
    ]

    last_error: Exception | None = None

    for transient_attempt in range(settings.llm_max_retries):
        try:
            response = await llm.ainvoke(messages)
        except Exception as exc:  # timeout / network / rate limit
            last_error = exc
            delay = settings.node_backoff_base_seconds ** transient_attempt
            log.warning("LLM transient failure (attempt %s): %s", transient_attempt + 1, exc)
            await asyncio.sleep(delay)
            continue

        raw = _extract_json(response.content)
        for schema_attempt in range(settings.llm_schema_retries + 1):
            try:
                return output_model.model_validate_json(raw)
            except ValidationError as exc:
                last_error = exc
                if schema_attempt == settings.llm_schema_retries:
                    break
                log.warning("LLM schema violation, repairing (attempt %s)", schema_attempt + 1)
                repair = await llm.ainvoke(
                    messages + [("ai", raw), ("human", REPAIR_INSTRUCTION.format(errors=str(exc)[:2000]))]
                )
                raw = _extract_json(repair.content)
        break

    raise RuntimeError(f"structured LLM call failed: {last_error}")
