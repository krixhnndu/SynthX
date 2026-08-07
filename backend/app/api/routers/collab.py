"""Multi-user Collaboration (SRS section 8.9): comments, assignments, and the
encrypted document download route that replaces the dead /files URL."""
import mimetypes

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require
from app.core import rbac
from app.core.audit import record as audit_record
from app.db.models import CaseAssignee, CaseComment, Contract, ContractCase, User
from app.db.session import get_db
from app.storage.base import get_storage

router = APIRouter(prefix="/contracts", tags=["collaboration"])


class CommentIn(BaseModel):
    comment: str


class AssignmentsIn(BaseModel):
    userIds: list[str]


def _ensure_case(db: Session, case_id: str) -> None:
    if db.get(ContractCase, case_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "case not found")


@router.get("/{case_id}/comments")
def get_comments(
    case_id: str,
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "read")),
    db: Session = Depends(get_db),
):
    _ensure_case(db, case_id)
    rows = db.execute(
        select(CaseComment, User)
        .outerjoin(User, User.id == CaseComment.author_id)
        .where(CaseComment.case_id == case_id)
        .order_by(CaseComment.created_at)
    ).all()
    return [
        {
            "id": c.id,
            "author": u.name if u else "deleted user",
            "authorEmail": u.email if u else "",
            "body": c.body,
            "at": c.created_at,
        }
        for c, u in rows
    ]


@router.post("/{case_id}/comments", status_code=status.HTTP_201_CREATED)
def add_comment(
    case_id: str,
    body: CommentIn,
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "create")),
    db: Session = Depends(get_db),
):
    _ensure_case(db, case_id)
    if not body.comment.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "comment is empty")
    comment = CaseComment(case_id=case_id, author_id=user.id, body=body.comment.strip())
    db.add(comment)
    db.commit()
    audit_record(db, actor=user.email, actor_id=user.id, action="case_commented",
                 case_id=case_id, meta={})
    return {"id": comment.id, "at": comment.created_at}


@router.get("/{case_id}/assignments")
def get_assignments(
    case_id: str,
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "read")),
    db: Session = Depends(get_db),
):
    _ensure_case(db, case_id)
    rows = db.execute(
        select(User, CaseAssignee)
        .join(CaseAssignee, CaseAssignee.user_id == User.id)
        .where(CaseAssignee.case_id == case_id)
        .order_by(User.name)
    ).all()
    return [{"userId": u.id, "name": u.name, "email": u.email} for u, _ in rows]


@router.put("/{case_id}/assignments")
def set_assignments(
    case_id: str,
    body: AssignmentsIn,
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "create")),
    db: Session = Depends(get_db),
):
    _ensure_case(db, case_id)
    unique = list(dict.fromkeys(body.userIds))
    found = set(db.execute(select(User.id).where(User.id.in_(unique))).scalars())
    missing = set(unique) - found
    if missing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            f"unknown user ids: {sorted(missing)}")
    db.execute(delete(CaseAssignee).where(CaseAssignee.case_id == case_id))
    for uid in unique:
        db.add(CaseAssignee(case_id=case_id, user_id=uid, assigned_by=user.email))
    db.commit()
    audit_record(db, actor=user.email, actor_id=user.id, action="case_assigned",
                 case_id=case_id, meta={"userIds": unique})
    return {"assigned": unique}


@router.get("/{case_id}/file")
def get_case_file(
    case_id: str,
    kind: str = "original",
    user: CurrentUser = Depends(require(rbac.RESOURCE_CASE, "read")),
    db: Session = Depends(get_db),
):
    if kind not in ("original", "comparison"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "kind must be original or comparison")
    case = db.get(ContractCase, case_id)
    if case is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "case not found")
    contract = db.get(Contract, case.contract_id) if case.contract_id else None
    if contract is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no file on this case")
    ref = contract.storage_ref if kind == "original" else contract.comparison_storage_ref
    if ref is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"no {kind} file on this case")
    data = get_storage().get(ref)
    filename = contract.original_filename
    media_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    return Response(
        data, media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
