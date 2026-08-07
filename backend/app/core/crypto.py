"""Envelope encryption for PII and legal_knowledge_documents.content (section 12)."""
import base64
import os

from cryptography.fernet import Fernet


def _key() -> bytes:
    raw = os.getenv("FIELD_ENCRYPTION_KEY")
    if not raw:
        # Dev fallback only. Production must inject a managed key.
        raw = base64.urlsafe_b64encode(b"0" * 32).decode()
    return raw.encode()


_fernet = Fernet(_key())


def encrypt(value: str) -> str:
    return _fernet.encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    return _fernet.decrypt(value.encode()).decode()


def encrypt_bytes(data: bytes) -> bytes:
    """Fernet envelope for binary payloads (uploaded contract files)."""
    return _fernet.encrypt(data)


def decrypt_bytes(token: bytes) -> bytes:
    return _fernet.decrypt(token)
