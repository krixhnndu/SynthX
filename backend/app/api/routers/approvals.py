"""Approval Tracker (SRS section 8.4): cross-case view of what awaits the current
user and the decisions they have made."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require
from app.core import rbac
from app.db.models import ContractCase, ReviewDecision
from app.db.session import get_db

router = APIRouter(prefix="/approvals", tags=["approvals"])


def _approval_context(case: ContractCase) -> dict:
    risk = case.risk_score or 0.0
    return {"risk_score": risk,
            "financial_exposure": (case.payload or {}).get("risk", {}).get("riskScore", 0.0)}


@router.get("/awaiting")
def awaiting_approval(
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "read")),
    db: Session = Depends(get_db),
):
    cases = db.execute(
        select(ContractCase)
        .where(ContractCase.status == "awaiting_review")
        .order_by(ContractCase.created_at.desc())
    ).scalars().all()
    return [
        {
            "caseId": c.id, "currentStage": c.current_stage,
            "riskScore": c.risk_score, "createdAt": c.created_at,
            "canApprove": rbac.is_allowed(db, user.roles, rbac.RESOURCE_REVIEW,
                                          "approve", _approval_context(c)),
        }
        for c in cases
    ]


@router.get("/decisions")
def my_decisions(
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "read")),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        select(ReviewDecision, ContractCase)
        .join(ContractCase, ReviewDecision.case_id == ContractCase.id)
        .where(ReviewDecision.reviewer_id == user.id)
        .order_by(ReviewDecision.created_at.desc())
    ).all()
    return [
        {"caseId": d.case_id, "decision": d.decision, "comment": d.comment,
         "at": d.created_at, "caseStatus": c.status}
        for d, c in rows
    ]
