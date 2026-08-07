"""Stage execution: dispatch, retry with exponential backoff, agent_runs bookkeeping,
optimistic-locked namespace writes, audit rows, live status events.

The orchestrator performs no legal reasoning. It schedules, parallelises, tracks
dependencies and logs (master prompt section 2).
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from app.agents.base import AgentInput
from app.agents.registry import get_agent
from app.config import settings
from app.core.audit import record as audit_record
from app.core.locking import write_namespace
from app.db.models import AgentRun, ContractCase
from app.db.session import SessionLocal
from app.orchestrator.events import publish
from app.orchestrator.graph_config import (
    CONDITIONAL_AGENTS, SATISFYING_STATUSES, STAGE_BY_NUMBER,
)

log = logging.getLogger(__name__)


def _snapshot(case_id: str) -> dict[str, Any]:
    db = SessionLocal()
    try:
        case = db.get(ContractCase, case_id)
        return dict(case.payload or {})
    finally:
        db.close()


def _should_skip(agent_name: str, snapshot: dict[str, Any]) -> bool:
    if agent_name not in CONDITIONAL_AGENTS:
        return False
    if agent_name == "cross_document_comparison":
        return not snapshot.get("document", {}).get("comparisonFileRef")
    return False


def _set_run(case_id: str, agent_name: str, stage: int, **fields) -> None:
    db = SessionLocal()
    try:
        run = db.execute(
            select(AgentRun).where(AgentRun.case_id == case_id, AgentRun.agent_name == agent_name)
        ).scalars().first()
        if run is None:
            run = AgentRun(case_id=case_id, agent_name=agent_name, stage=stage)
            db.add(run)
        for key, value in fields.items():
            setattr(run, key, value)
        db.commit()
    finally:
        db.close()


async def _run_agent(case_id: str, agent_name: str, stage: int) -> dict[str, Any]:
    snapshot = _snapshot(case_id)

    if _should_skip(agent_name, snapshot):
        _set_run(case_id, agent_name, stage, status="skipped",
                 completed_at=datetime.now(timezone.utc))
        await publish(case_id, {"type": "agent_status", "agent": agent_name, "status": "skipped"})
        return {"agent": agent_name, "status": "skipped"}

    agent = get_agent(agent_name)
    task_payload = snapshot.get("_taskPayload", {}).get(agent_name, {})

    last_error: Exception | None = None
    for attempt in range(1, settings.node_max_retries + 1):
        _set_run(case_id, agent_name, stage, status="running", attempt=attempt,
                 started_at=datetime.now(timezone.utc), error=None)
        await publish(case_id, {"type": "agent_status", "agent": agent_name,
                                "status": "running", "attempt": attempt})
        try:
            output = await agent.run(
                AgentInput(caseId=case_id, contractCaseSnapshot=snapshot, taskPayload=task_payload)
            )
            db = SessionLocal()
            try:
                write_namespace(db, case_id, agent_name, output.namespace, output.data)
            finally:
                db.close()

            _set_run(case_id, agent_name, stage, status="completed",
                     completed_at=datetime.now(timezone.utc),
                     confidence_score=output.confidence)
            await publish(case_id, {"type": "agent_status", "agent": agent_name,
                                    "status": "completed", "confidence": output.confidence})
            return {"agent": agent_name, "status": "completed"}

        except Exception as exc:
            last_error = exc
            log.warning("agent %s failed (attempt %s): %s", agent_name, attempt, exc)
            if attempt < settings.node_max_retries:
                await asyncio.sleep(settings.node_backoff_base_seconds ** attempt)

    _set_run(case_id, agent_name, stage, status="failed",
             completed_at=datetime.now(timezone.utc), error=str(last_error)[:2000])
    await publish(case_id, {"type": "agent_status", "agent": agent_name,
                            "status": "failed", "error": str(last_error)[:500]})
    return {"agent": agent_name, "status": "failed", "error": str(last_error)}


def _dependencies_satisfied(case_id: str, stage: int) -> bool:
    spec = STAGE_BY_NUMBER[stage]
    if not spec.depends_on:
        return True
    db = SessionLocal()
    try:
        for dep in spec.depends_on:
            required = STAGE_BY_NUMBER[dep].agents
            runs = db.execute(
                select(AgentRun).where(AgentRun.case_id == case_id,
                                       AgentRun.agent_name.in_(required))
            ).scalars().all()
            statuses = {r.agent_name: r.status for r in runs}
            for agent in required:
                if statuses.get(agent) not in SATISFYING_STATUSES:
                    return False
        return True
    finally:
        db.close()


async def run_stage(case_id: str, stage: int) -> dict[str, Any]:
    spec = STAGE_BY_NUMBER[stage]

    if not _dependencies_satisfied(case_id, stage):
        return {"stage": stage, "status": "blocked"}

    db = SessionLocal()
    try:
        audit_record(db, actor="Workflow Orchestrator", action="stage_started", case_id=case_id,
                     meta={"stage": stage, "agents": list(spec.agents)})
        case = db.get(ContractCase, case_id)
        case.current_stage = stage
        db.commit()
    finally:
        db.close()

    await publish(case_id, {"type": "stage", "stage": stage, "name": spec.name,
                            "status": "started"})

    if spec.parallel:
        results = await asyncio.gather(
            *[_run_agent(case_id, agent, stage) for agent in spec.agents]
        )
    else:
        results = [await _run_agent(case_id, agent, stage) for agent in spec.agents]

    failed = [r for r in results if r["status"] == "failed"]
    status = "failed" if failed else "completed"

    db = SessionLocal()
    try:
        audit_record(db, actor="Workflow Orchestrator", action="stage_completed", case_id=case_id,
                     meta={"stage": stage, "status": status, "results": results})
        if failed:
            case = db.get(ContractCase, case_id)
            case.status = "awaiting_review"
            payload = dict(case.payload or {})
            consensus = dict(payload.get("consensus") or {})
            reasons = list(consensus.get("escalationReasons") or [])
            reasons.append(f"agent failure in stage {stage}: "
                           f"{', '.join(f['agent'] for f in failed)}")
            consensus["escalationReasons"] = reasons
            payload["consensus"] = consensus
            case.payload = payload
            db.commit()
    finally:
        db.close()

    await publish(case_id, {"type": "stage", "stage": stage, "status": status})
    return {"stage": stage, "status": status, "results": results}


async def finalise_pipeline(case_id: str) -> None:
    """After Stage 7 the case blocks at Stage 8 until a reviewer decides."""
    db = SessionLocal()
    try:
        case = db.get(ContractCase, case_id)
        if case.status == "in_progress":
            case.status = "awaiting_review"
            case.current_stage = 8
            db.commit()
        audit_record(db, actor="Workflow Orchestrator", action="stage_started", case_id=case_id,
                     meta={"stage": 8, "agents": []})
    finally:
        db.close()
    await publish(case_id, {"type": "stage", "stage": 8, "status": "awaiting_review"})
