import os
from pathlib import Path

from cryptography.fernet import InvalidToken

from app.config import settings
from app.core.crypto import decrypt_bytes, encrypt_bytes
from app.storage.base import StorageAdapter


class LocalStorage(StorageAdapter):
    def __init__(self) -> None:
        self.root = Path(settings.storage_local_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    def put(self, key: str, data: bytes, content_type: str | None = None) -> str:
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(encrypt_bytes(data))
        return f"local://{key}"

    def get(self, ref: str) -> bytes:
        key = ref.replace("local://", "")
        raw = (self.root / key).read_bytes()
        try:
            return decrypt_bytes(raw)
        except InvalidToken:
            # Plaintext file written before encryption was enabled and not yet
            # migrated (scripts/encrypt_storage.py). Serve it as-is.
            return raw

    def url(self, ref: str, expires_seconds: int = 900) -> str:
        return f"/files/{ref.replace('local://', '')}"
