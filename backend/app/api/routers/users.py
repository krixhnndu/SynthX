"""User invitation & role assignment (SRS section 8.11). Listing is available to
any authenticated user (the assignment picker needs it); create/update are Admin
only via the seeded RESOURCE_USER policies."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, current_user, require
from app.core import rbac
from app.core.audit import record as audit_record
from app.core.security import hash_password
from app.db.models import Role, User, UserRole
from app.db.session import get_db

router = APIRouter(prefix="/users", tags=["users"])


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    roles: list[str] = []


class UserUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None
    roles: list[str] | None = None


def _resolve_roles(db: Session, names: list[str]) -> list[Role]:
    roles = db.execute(select(Role).where(Role.name.in_(names))).scalars().all()
    missing = set(names) - {r.name for r in roles}
    if missing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            f"unknown roles: {sorted(missing)}")
    return roles


@router.get("/roles")
def list_roles(
    user: CurrentUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    roles = db.execute(select(Role).order_by(Role.name)).scalars().all()
    return [{"id": r.id, "name": r.name} for r in roles]


@router.get("")
def list_users(
    user: CurrentUser = Depends(current_user),
    db: Session = Depends(get_db),
):
    users = db.execute(select(User).order_by(User.created_at.desc())).scalars().all()
    return [
        {"id": u.id, "name": u.name, "email": u.email,
         "roles": [r.name for r in u.roles], "isActive": u.is_active,
         "createdAt": u.created_at}
        for u in users
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(
    body: UserCreate,
    user: CurrentUser = Depends(require(rbac.RESOURCE_USER, "create")),
    db: Session = Depends(get_db),
):
    email = body.email.lower()
    if db.execute(select(User).where(User.email == email)).scalars().first():
        raise HTTPException(status.HTTP_409_CONFLICT, "email already registered")
    roles = _resolve_roles(db, body.roles)
    new_user = User(name=body.name, email=email, password_hash=hash_password(body.password))
    db.add(new_user)
    db.flush()
    for role in roles:
        db.add(UserRole(user_id=new_user.id, role_id=role.id))
    db.commit()
    audit_record(db, actor=user.email, actor_id=user.id, action="user_created",
                 meta={"email": email, "roles": body.roles})
    return {"id": new_user.id, "email": email, "roles": body.roles}


@router.patch("/{user_id}")
def update_user(
    user_id: str,
    body: UserUpdate,
    user: CurrentUser = Depends(require(rbac.RESOURCE_USER, "update")),
    db: Session = Depends(get_db),
):
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "user not found")
    if body.name is not None:
        target.name = body.name
    if body.is_active is not None:
        target.is_active = body.is_active
    if body.roles is not None:
        roles = _resolve_roles(db, body.roles)
        db.execute(delete(UserRole).where(UserRole.user_id == target.id))
        for role in roles:
            db.add(UserRole(user_id=target.id, role_id=role.id))
    db.commit()
    audit_record(db, actor=user.email, actor_id=user.id, action="user_updated",
                 meta={"userId": user_id, "roles": body.roles, "isActive": body.is_active})
    return {"id": target.id, "email": target.email,
            "roles": [r.name for r in target.roles], "isActive": target.is_active}
