"""Seed roles, the RBAC policy table, and the bootstrap Admin.

Run once: python -m app.seed
The bootstrap admin password comes from BOOTSTRAP_ADMIN_PASSWORD and must be rotated
after first login (docs/OPEN_DECISIONS.md, gap 4).
"""
import os

from sqlalchemy import select

from app.core import rbac
from app.core.security import hash_password
from app.db.models import Policy, Role, User, UserRole
from app.db.session import SessionLocal

ROLES = ["Legal", "Finance", "Procurement", "Technical", "Executive Approver", "Admin"]

# (role, resource, action, condition)
POLICIES = [
    ("Admin", rbac.RESOURCE_CASE, "create", None),
    ("Admin", rbac.RESOURCE_CASE, "read", None),
    ("Admin", rbac.RESOURCE_REPORT, "read", None),
    ("Admin", rbac.RESOURCE_AUDIT, "read", None),
    ("Admin", rbac.RESOURCE_KNOWLEDGE, "ingest", None),
    ("Admin", rbac.RESOURCE_KNOWLEDGE, "query", None),

    ("Legal", rbac.RESOURCE_CASE, "create", None),
    ("Legal", rbac.RESOURCE_CASE, "read", None),
    ("Legal", rbac.RESOURCE_REPORT, "read", None),
    ("Legal", rbac.RESOURCE_AUDIT, "read", None),
    ("Legal", rbac.RESOURCE_REVIEW, "approve", None),
    ("Legal", rbac.RESOURCE_REVIEW, "request_changes", None),
    ("Legal", rbac.RESOURCE_REVIEW, "reject", None),

    ("Executive Approver", rbac.RESOURCE_CASE, "read", None),
    ("Executive Approver", rbac.RESOURCE_REPORT, "read", None),
    ("Executive Approver", rbac.RESOURCE_AUDIT, "read", None),
    ("Executive Approver", rbac.RESOURCE_REVIEW, "approve", None),
    ("Executive Approver", rbac.RESOURCE_REVIEW, "request_changes", None),
    ("Executive Approver", rbac.RESOURCE_REVIEW, "reject", None),

    # Finance and Procurement may approve only below the high-exposure threshold.
    ("Finance", rbac.RESOURCE_CASE, "create", None),
    ("Finance", rbac.RESOURCE_CASE, "read", None),
    ("Finance", rbac.RESOURCE_REPORT, "read", None),
    ("Finance", rbac.RESOURCE_REVIEW, "approve", {"max_risk_score": 0.7}),
    ("Finance", rbac.RESOURCE_REVIEW, "request_changes", None),

    ("Procurement", rbac.RESOURCE_CASE, "create", None),
    ("Procurement", rbac.RESOURCE_CASE, "read", None),
    ("Procurement", rbac.RESOURCE_REPORT, "read", None),
    ("Procurement", rbac.RESOURCE_REVIEW, "approve", {"max_risk_score": 0.5}),
    ("Procurement", rbac.RESOURCE_REVIEW, "request_changes", None),

    ("Technical", rbac.RESOURCE_CASE, "read", None),
    ("Technical", rbac.RESOURCE_REPORT, "read", None),
    ("Technical", rbac.RESOURCE_REVIEW, "request_changes", None),
]


def main() -> None:
    db = SessionLocal()
    try:
        role_ids = {}
        for name in ROLES:
            role = db.execute(select(Role).where(Role.name == name)).scalars().first()
            if role is None:
                role = Role(name=name)
                db.add(role)
                db.flush()
            role_ids[name] = role.id

        for role, resource, action, condition in POLICIES:
            exists = db.execute(
                select(Policy).where(Policy.role == role, Policy.resource == resource,
                                     Policy.action == action)
            ).scalars().first()
            if exists is None:
                db.add(Policy(role=role, resource=resource, action=action, condition=condition))

        email = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "admin@example.com")
        admin = db.execute(select(User).where(User.email == email)).scalars().first()
        if admin is None:
            admin = User(
                name="Bootstrap Admin", email=email,
                password_hash=hash_password(os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "changeme123")),
            )
            db.add(admin)
            db.flush()
            db.add(UserRole(user_id=admin.id, role_id=role_ids["Admin"]))

        db.commit()
        print(f"seeded {len(ROLES)} roles, {len(POLICIES)} policies, admin={email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
