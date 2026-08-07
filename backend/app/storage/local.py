import os
from pathlib import Path

from app.config import settings
from app.storage.base import StorageAdapter


class LocalStorage(StorageAdapter):
    def __init__(self) -> None:
        self.root = Path(settings.storage_local_dir)
        self.root.mkdir(parents=True, exist_ok=True)

    def put(self, key: str, data: bytes, content_type: str | None = None) -> str:
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return f"local://{key}"

    def get(self, ref: str) -> bytes:
        key = ref.replace("local://", "")
        return (self.root / key).read_bytes()

    def url(self, ref: str, expires_seconds: int = 900) -> str:
        return f"/files/{ref.replace('local://', '')}"
