"""JWT issuing/verification and password hashing.

Hashing is direct ``bcrypt`` - not passlib, which is unmaintained and crashes on
every bcrypt >= 4.1 (removed ``__about__``, raises on >72-byte passwords). Using
the bcrypt library directly makes this immune to bcrypt version drift.
"""
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.config import settings

# bcrypt only reads the first 72 bytes of a password. passlib silently truncated
# to 72; bcrypt >= 4.1 raises instead. Truncate explicitly so long passwords
# hash and verify identically on every bcrypt version, and legacy passlib hashes
# (also truncated to 72 bytes) still verify.
_BCRYPT_MAX_BYTES = 72


def _password_bytes(raw: str) -> bytes:
    return raw.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(raw: str) -> str:
    hashed = bcrypt.hashpw(_password_bytes(raw), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_password_bytes(raw), hashed.encode("utf-8"))
    except ValueError:
        # Malformed or non-bcrypt hash in the DB: fail the check, not the request.
        return False


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
