"""Schema-validated LLM calls.

The master prompt's retry policy only covers transient failure. A model returning
well-formed JSON that violates the namespace schema is a third failure mode, so it
gets its own bounded repair loop here (docs/OPEN_DECISIONS.md, gap 5).
"""
import asyncio
import json
import logging
import re
from typing import Type, TypeVar

from pydantic import BaseModel, ValidationError

from app.config import settings
from app.llm.groq_client import get_llm

log = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)

# Groq's 429 body names the wait: "Please try again in 20.84s."
_RETRY_AFTER_RE = re.compile(r"try again in ([\d.]+)s", re.IGNORECASE)


def _retry_after_hint(exc: Exception) -> float | None:
    m = _RETRY_AFTER_RE.search(str(exc))
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None

REPAIR_INSTRUCTION = (
    "Your previous response did not match the required schema. If you echoed the "
    "schema itself (e.g. $defs, properties, or type definitions), you must return "
    "the DATA INSTANCE that conforms to it instead.\n"
    "Validation errors:\n{errors}\n"
    "Return the corrected JSON data instance only - NOT the schema definition. "
    "No prose, no markdown fences."
)

# How much of the model's own (invalid) output is replayed in a schema-repair call.
MAX_REPAIR_CONTEXT = 4000


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
    schema_hint = json.dumps(output_model.model_json_schema(), indent=2)
    # "matching this schema" is ambiguous to smaller models - llama-3.1-8b was
    # echoing the schema definition itself ($defs, properties) instead of producing
    # a data instance, forcing a repair on every call. Spell out the target.
    system = (f"{system_prompt}\n\nYou must respond with a JSON OBJECT (a data "
              f"instance) that conforms to the following JSON Schema.\n\n"
              f"Schema:\n{schema_hint}\n\n"
              f"Rules:\n"
              f"- Return the DATA INSTANCE only - do NOT echo the schema definition, "
              f"do NOT include $defs, properties, or type declarations.\n"
              f"- Output raw JSON only - no markdown fences, no commentary.")
    messages = [("system", system), ("human", user_content)]

    last_error: Exception | None = None

    for transient_attempt in range(settings.llm_max_retries):
        llm = get_llm(temperature=temperature, long_context=long_context)
        try:
            response = await llm.ainvoke(messages)
        except Exception as exc:  # timeout / network / rate limit
            last_error = exc
            delay = settings.node_backoff_base_seconds ** transient_attempt
            hint = _retry_after_hint(exc)
            if hint is not None:
                # The exponential backoff (1s, 2s, 4s) is far shorter than a TPM
                # rate window; honour the server's wait or every retry re-fires into
                # the same exhausted minute and burns the remaining quota for nothing.
                delay = max(delay, hint + 1.0)
            log.warning("LLM transient failure (attempt %s, retry in %.1fs): %s",
                        transient_attempt + 1, delay, exc)
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
                # A schema repair is a formatting fix against the model's own output and
                # the validation errors - not a fresh analysis, so the full contract
                # snapshot is NOT replayed here. Re-sending `messages` roughly tripled
                # the repair request (schema + snapshot + first attempt) and exhausted
                # the free-tier minute by itself. Dropping the snapshot leaves the schema
                # and the model's output; `llm_schema_retries` bounds how far a wrong
                # guess can loop, so a genuinely missing required field still fails the
                # stage instead of hanging.
                repair = await llm.ainvoke(
                    [("system", system),
                     ("ai", raw[:MAX_REPAIR_CONTEXT]),
                     ("human", REPAIR_INSTRUCTION.format(errors=str(exc)[:2000]))]
                )
                raw = _extract_json(repair.content)
        break

    raise RuntimeError(f"structured LLM call failed: {last_error}")
