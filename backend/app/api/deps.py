from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core import rbac
from app.core.security import decode_token
from app.db.models import User
from app.db.session import get_db

bearer = HTTPBearer(auto_error=True)


class CurrentUser:
    def __init__(self, user_id: str, email: str, roles: list[str]):
        self.id = user_id
        self.email = email
        self.roles = roles


def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> CurrentUser:
    try:
        claims = decode_token(creds.credentials)
    except Exception as exc:
        print(f"JWT DECODE FAILED: {exc}")
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid or expired token")
    if claims.get("typ") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "wrong token type")
    return CurrentUser(claims["sub"], claims.get("email", ""), claims.get("roles", []))


def require(resource: str, action: str):
    """Route guard reading the policy table. Never a hardcoded role list."""
    def guard(user: CurrentUser = Depends(current_user), db: Session = Depends(get_db)):
        if not rbac.is_allowed(db, user.roles, resource, action):
            raise HTTPException(status.HTTP_403_FORBIDDEN,
                                f"role(s) {user.roles} may not {action} {resource}")
        return user
    return guard


def filter_case_for_roles(payload: dict[str, Any], roles: list[str]) -> dict[str, Any]:
    """Server-side field filtering. Frontend gating is UX only, never the boundary."""
    filtered = dict(payload)
    report = dict(filtered.get("report") or {})
    if report.get("sections"):
        report["sections"] = rbac.visible_report_sections(roles, report["sections"])
        filtered["report"] = report
    return filtered
