"""Redis pub/sub fanout for live agent status. WebSocket handlers subscribe per case."""
import json
import logging
from typing import Any

import redis.asyncio as aioredis

from app.config import settings

log = logging.getLogger(__name__)

CHANNEL = "case:{case_id}"


async def get_redis() -> aioredis.Redis:
    return aioredis.from_url(settings.redis_url, decode_responses=True)


async def publish(case_id: str, event: dict[str, Any]) -> None:
    # Best-effort live status fanout: nothing in the pipeline reads these events,
    # so a down Redis must not fail a stage. Log and continue (the SQLite agent_runs
    # rows are the source of truth for status).
    client = await get_redis()
    try:
        await client.publish(CHANNEL.format(case_id=case_id), json.dumps(event))
    except Exception as exc:
        log.warning("event publish skipped for case %s (Redis unreachable?): %s",
                    case_id, exc)
    finally:
        await client.aclose()
