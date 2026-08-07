"""Data-driven RBAC (master prompt section 9).

Permission decisions read the `policies` table; nothing is hardcoded per route.
Adding a role or resource is an INSERT, not a code change.
"""
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Policy

# Resources referenced by routers
RESOURCE_CASE = "contract_case"
RESOURCE_REPORT = "report"
RESOURCE_REVIEW = "review"
RESOURCE_AUDIT = "audit"
RESOURCE_KNOWLEDGE = "legal_knowledge"

# Report sections each role may see, applied by api/deps.filter_case_for_roles
ROLE_REPORT_SECTIONS: dict[str, list[str] | str] = {
    "Admin": "*",
    "Legal": "*",
    "Executive Approver": "*",
    "Finance": [
        "Executive Summary", "Contract Summary", "Key Obligations", "Timeline",
        "Risk Assessment", "Negotiation Strategy", "Final Enterprise Recommendation",
    ],
    "Procurement": [
        "Executive Summary", "Contract Summary", "Contract Overview", "Key Obligations",
        "Timeline", "Contract Comparison", "Negotiation Strategy",
        "Final Enterprise Recommendation",
    ],
    "Technical": [
        "Executive Summary", "Contract Overview", "Clause Classification",
        "Key Obligations", "Timeline", "Explainability",
    ],
}


def is_allowed(db: Session, roles: list[str], resource: str, action: str,
               context: dict[str, Any] | None = None) -> bool:
    rows = db.execute(
        select(Policy).where(
            Policy.role.in_(roles), Policy.resource == resource, Policy.action == action
        )
    ).scalars().all()
    if not rows:
        return False
    context = context or {}
    for policy in rows:
        if not policy.condition:
            return True
        if _condition_holds(policy.condition, context):
            return True
    return False


def _condition_holds(condition: dict[str, Any], context: dict[str, Any]) -> bool:
    """Attribute predicates, e.g. {"max_risk_score": 0.7} means the role may act
    only while the case risk score is at or below that value."""
    for key, expected in condition.items():
        if key.startswith("max_"):
            actual = context.get(key[4:])
            if actual is not None and actual > expected:
                return False
        elif key.startswith("min_"):
            actual = context.get(key[4:])
            if actual is not None and actual < expected:
                return False
        else:
            if context.get(key) != expected:
                return False
    return True


def visible_report_sections(roles: list[str], all_sections: dict[str, Any]) -> dict[str, Any]:
    allowed: set[str] = set()
    for role in roles:
        spec = ROLE_REPORT_SECTIONS.get(role)
        if spec == "*":
            return all_sections
        if isinstance(spec, list):
            allowed.update(spec)
    return {k: v for k, v in all_sections.items() if k in allowed}
