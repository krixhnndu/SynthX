"""Live agent execution status. Subscribes to the Redis channel for one case."""
import asyncio
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.security import decode_token
from app.orchestrator.events import CHANNEL, get_redis

router = APIRouter()


@router.websocket("/ws/contracts/{case_id}")
async def case_status_socket(websocket: WebSocket, case_id: str, token: str = ""):
    try:
        decode_token(token)
    except Exception:
        await websocket.close(code=4401)
        return

    await websocket.accept()
    client = await get_redis()
    pubsub = client.pubsub()
    await pubsub.subscribe(CHANNEL.format(case_id=case_id))

    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=30)
            if message:
                await websocket.send_text(message["data"])
            else:
                await websocket.send_text(json.dumps({"type": "heartbeat"}))
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe()
        await client.aclose()
