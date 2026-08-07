"""JWT issuing/verification and password hashing."""
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(raw: str) -> str:
    return pwd_context.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    return pwd_context.verify(raw, hashed)


def _encode(payload: dict[str, Any], minutes: int, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    body = {**payload, "iat": now, "exp": now + timedelta(minutes=minutes), "typ": token_type}
    return jwt.encode(body, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str, email: str, roles: list[str]) -> str:
    return _encode({"sub": user_id, "email": email, "roles": roles},
                   settings.jwt_expiry_minutes, "access")


def create_refresh_token(user_id: str) -> str:
    return _encode({"sub": user_id}, 60 * 24 * 14, "refresh")


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
