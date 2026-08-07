from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit import record as audit_record
from app.core.security import (
    create_access_token, create_refresh_token, decode_token, verify_password,
)
from app.db.models import User
from app.db.session import get_db
from app.schemas.api import LoginRequest, RefreshRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == body.email)).scalars().first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid credentials")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "account disabled")

    roles = [r.name for r in user.roles]
    audit_record(db, actor=user.email, actor_id=user.id, action="login")
    return TokenResponse(
        access_token=create_access_token(user.id, user.email, roles),
        refresh_token=create_refresh_token(user.id),
        roles=roles,
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        claims = decode_token(body.refresh_token)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid refresh token")
    if claims.get("typ") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "wrong token type")

    user = db.get(User, claims["sub"])
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user unavailable")
    roles = [r.name for r in user.roles]
    return TokenResponse(
        access_token=create_access_token(user.id, user.email, roles),
        refresh_token=create_refresh_token(user.id),
        roles=roles,
    )
