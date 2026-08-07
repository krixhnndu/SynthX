"""One-time migration: re-encrypt plaintext files under the local storage dir.

Idempotent - files that already decrypt are skipped. Run from backend/:
    python scripts/encrypt_storage.py
"""
from pathlib import Path

from cryptography.fernet import InvalidToken

from app.config import settings
from app.core.crypto import decrypt_bytes, encrypt_bytes


def main() -> None:
    root = Path(settings.storage_local_dir)
    if not root.exists():
        print(f"storage dir does not exist: {root}")
        return

    migrated = skipped = 0
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        raw = path.read_bytes()
        try:
            decrypt_bytes(raw)
        except InvalidToken:
            path.write_bytes(encrypt_bytes(raw))
            migrated += 1
            print(f"encrypted {path.relative_to(root)}")
            continue
        skipped += 1

    print(f"done: {migrated} encrypted, {skipped} already encrypted")


if __name__ == "__main__":
    main()
