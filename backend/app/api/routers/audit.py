from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require
from app.core import rbac
from app.db.models import AuditLog
from app.db.session import get_db

router = APIRouter(prefix="/contracts", tags=["audit"])


@router.get("/{case_id}/audit")
def get_audit_trail(
    case_id: str,
    user: CurrentUser = Depends(require(rbac.RESOURCE_AUDIT, "read")),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        select(AuditLog).where(AuditLog.case_id == case_id).order_by(AuditLog.created_at)
    ).scalars().all()
    return [
        {"actor": r.actor, "actorId": r.actor_id, "action": r.action,
         "metadata": r.meta, "timestamp": r.created_at}
        for r in rows
    ]
