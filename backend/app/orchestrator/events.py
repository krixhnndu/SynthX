"""Redis pub/sub fanout for live agent status. WebSocket handlers subscribe per case."""
import json
from typing import Any

import redis.asyncio as aioredis

from app.config import settings

CHANNEL = "case:{case_id}"


async def get_redis() -> aioredis.Redis:
    return aioredis.from_url(settings.redis_url, decode_responses=True)


async def publish(case_id: str, event: dict[str, Any]) -> None:
    client = await get_redis()
    try:
        await client.publish(CHANNEL.format(case_id=case_id), json.dumps(event))
    finally:
        await client.aclose()
