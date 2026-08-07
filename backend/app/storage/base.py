from abc import ABC, abstractmethod


class StorageAdapter(ABC):
    """Local disk in dev, S3 in prod - swapped by config, never by rewrite."""

    @abstractmethod
    def put(self, key: str, data: bytes, content_type: str | None = None) -> str: ...

    @abstractmethod
    def get(self, ref: str) -> bytes: ...

    @abstractmethod
    def url(self, ref: str, expires_seconds: int = 900) -> str: ...


def get_storage() -> StorageAdapter:
    from app.config import settings
    if settings.storage_backend == "s3":
        from app.storage.s3 import S3Storage
        return S3Storage()
    from app.storage.local import LocalStorage
    return LocalStorage()
