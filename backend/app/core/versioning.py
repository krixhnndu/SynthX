"""Append-only Version History (SRS section 8.6).

Every successful Contract Case write - upload, each agent namespace write, each
review decision - leaves a full payload snapshot. The newest MAX_VERSIONS are
kept per case; older rows are pruned in the same transaction.
"""
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.models import CaseVersion

MAX_VERSIONS = 25


def record_version(db: Session, case_id: str, version: int, payload: dict,
                   source: str | None = None) -> None:
    db.add(CaseVersion(
        case_id=case_id, version=version, payload=payload, created_by=source,
    ))
    keep = [
        r.id for r in db.execute(
            select(CaseVersion.id)
            .where(CaseVersion.case_id == case_id)
            .order_by(CaseVersion.version.desc())
            .offset(MAX_VERSIONS)
        ).scalars()
    ]
    if keep:
        db.execute(delete(CaseVersion).where(CaseVersion.id.in_(keep)))
    db.commit()
