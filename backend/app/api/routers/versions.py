"""Version History (SRS section 8.6): list and read payload snapshots."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require
from app.core import rbac
from app.db.models import CaseVersion, ContractCase
from app.db.session import get_db

router = APIRouter(prefix="/contracts", tags=["versions"])


@router.get("/{case_id}/versions")
def list_versions(
    case_id: str,
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "read")),
    db: Session = Depends(get_db),
):
    if db.get(ContractCase, case_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "case not found")
    rows = db.execute(
        select(CaseVersion)
        .where(CaseVersion.case_id == case_id)
        .order_by(CaseVersion.version.desc())
    ).scalars().all()
    return [
        {
            "version": r.version, "createdAt": r.created_at, "createdBy": r.created_by,
            "status": (r.payload or {}).get("status"),
        }
        for r in rows
    ]


@router.get("/{case_id}/versions/{version}")
def get_version(
    case_id: str,
    version: int,
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "read")),
    db: Session = Depends(get_db),
):
    row = db.execute(
        select(CaseVersion)
        .where(CaseVersion.case_id == case_id, CaseVersion.version == version)
    ).scalars().first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "version not found")
    return {
        "version": row.version, "createdAt": row.created_at, "createdBy": row.created_by,
        "payload": row.payload,
    }
