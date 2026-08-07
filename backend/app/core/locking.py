"""Optimistic locking for concurrent Contract Case writes (master prompt section 5).

Stage 3 and Stage 4 agents run in parallel against one case, so every write is a
compare-and-swap on `version`. A namespace write is rejected if the caller does not
own that namespace.
"""
import asyncio
from typing import Any

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.db.models import ContractCase
from app.schemas.contract_case import NAMESPACE_OWNER


class NamespaceViolation(Exception):
    pass


class WriteConflict(Exception):
    pass


def write_namespace(db: Session, case_id: str, agent_name: str, namespace: str,
                    data: Any, max_attempts: int = 5) -> int:
    owner = NAMESPACE_OWNER.get(namespace)
    if owner is None:
        raise NamespaceViolation(f"unknown namespace: {namespace}")
    if owner != agent_name:
        raise NamespaceViolation(f"{agent_name} may not write namespace '{namespace}' (owned by {owner})")

    for _ in range(max_attempts):
        case = db.get(ContractCase, case_id)
        if case is None:
            raise WriteConflict(f"case {case_id} not found")
        current_version = case.version
        payload = dict(case.payload or {})
        payload[namespace] = data
        payload["version"] = current_version + 1

        result = db.execute(
            update(ContractCase)
            .where(ContractCase.id == case_id, ContractCase.version == current_version)
            .values(payload=payload, version=current_version + 1)
        )
        if result.rowcount == 1:
            db.commit()
            return current_version + 1
        db.rollback()
        db.expire_all()
    raise WriteConflict(f"could not write namespace '{namespace}' after {max_attempts} attempts")


def append_legal_evidence(db: Session, case_id: str, evidence: dict[str, Any],
                          max_attempts: int = 5) -> int:
    """legalEvidence is the one append-only list several agents contribute to."""
    for _ in range(max_attempts):
        case = db.get(ContractCase, case_id)
        current_version = case.version
        payload = dict(case.payload or {})
        items = list(payload.get("legalEvidence") or [])
        items.append(evidence)
        payload["legalEvidence"] = items
        result = db.execute(
            update(ContractCase)
            .where(ContractCase.id == case_id, ContractCase.version == current_version)
            .values(payload=payload, version=current_version + 1)
        )
        if result.rowcount == 1:
            db.commit()
            return current_version + 1
        db.rollback()
        db.expire_all()
    raise WriteConflict("could not append legal evidence")
