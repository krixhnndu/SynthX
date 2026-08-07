"""Append-only audit writer. Every state-changing action goes through here."""
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import AuditLog


def record(db: Session, *, actor: str, action: str, case_id: str | None = None,
           actor_id: str | None = None, meta: dict[str, Any] | None = None) -> None:
    db.add(AuditLog(case_id=case_id, actor=actor, actor_id=actor_id, action=action, meta=meta or {}))
    db.commit()
