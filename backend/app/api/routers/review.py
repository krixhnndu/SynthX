from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, current_user
from app.core import rbac
from app.core.audit import record as audit_record
from app.core.versioning import record_version
from app.db.models import ContractCase, ReviewDecision
from app.db.session import get_db
from app.schemas.api import ReviewSubmission

router = APIRouter(prefix="/contracts", tags=["review"])

DECISION_TO_STATUS = {
    "approve": "approved",
    "request_changes": "changes_requested",
    "reject": "rejected",
}


@router.post("/{case_id}/review")
def submit_review(
    case_id: str,
    body: ReviewSubmission,
    user: CurrentUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    case = db.get(ContractCase, case_id)
    if case is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "case not found")
    if case.status != "awaiting_review":
        raise HTTPException(status.HTTP_409_CONFLICT,
                            f"case is {case.status}, not awaiting review")

    # Attribute-aware policy check: high-exposure cases are gated by condition,
    # not by a hardcoded role list.
    context = {"risk_score": case.risk_score or 0.0,
               "financial_exposure": (case.payload or {}).get("risk", {}).get("riskScore", 0.0)}
    if not rbac.is_allowed(db, user.roles, rbac.RESOURCE_REVIEW, body.decision, context):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"role(s) {user.roles} may not {body.decision} this case at its risk level",
        )

    decision = ReviewDecision(
        case_id=case_id, reviewer_id=user.id, role=",".join(user.roles),
        decision=body.decision, comment=body.comment,
    )
    db.add(decision)

    payload = dict(case.payload or {})
    review = dict(payload.get("review") or {})
    decisions = list(review.get("decisions") or [])
    decisions.append({
        "reviewerId": user.id, "roles": user.roles, "decision": body.decision,
        "comment": body.comment, "at": datetime.now(timezone.utc).isoformat(),
    })
    review["decisions"] = decisions
    payload["review"] = review
    payload["status"] = DECISION_TO_STATUS[body.decision]

    case.payload = payload
    case.status = DECISION_TO_STATUS[body.decision]
    case.version += 1
    db.commit()

    record_version(db, case_id, case.version, payload, source=f"review:{body.decision}")

    audit_record(db, actor=user.email, actor_id=user.id, action="review_decision",
                 case_id=case_id, meta={"decision": body.decision, "roles": user.roles})

    return {"caseId": case_id, "status": case.status}
