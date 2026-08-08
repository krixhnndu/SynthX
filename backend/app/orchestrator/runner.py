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

from app.agents.base import AgentInput, AgentOutput
from app.agents.registry import get_agent
from app.config import settings
from app.core.audit import record as audit_record
from app.core.locking import write_namespace
from app.core.versioning import record_version
from app.db.models import AgentRun, ContractCase
from app.db.session import SessionLocal
from app.orchestrator.events import publish
from app.orchestrator.graph_config import (
    CONDITIONAL_AGENTS, SATISFYING_STATUSES, STAGE_BY_NUMBER,
)

log = logging.getLogger(__name__)

# The database helpers below are synchronous on purpose. The stage runner is async
# and Stage 3/4 dispatch several agents under asyncio.gather, so each helper is
# invoked through asyncio.to_thread to keep SQLite I/O off the event loop.


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


def _existing_run(case_id: str, agent_name: str) -> dict[str, str] | None:
    """Return the agent's prior result if it already succeeded at its stage.

    Pipeline re-runs (crash restart, or the local no-Redis script) restart the graph
    at stage 1. Re-running agents that already completed would re-burn LLM quota and
    overwrite their namespace snapshot with an identical CAS write - pointless. Only
    failed/pending agents execute on a re-run.
    """
    db = SessionLocal()
    try:
        run = db.execute(
            select(AgentRun).where(AgentRun.case_id == case_id,
                                   AgentRun.agent_name == agent_name)
        ).scalars().first()
        if run is not None and run.status in SATISFYING_STATUSES:
            return {"agent": agent_name, "status": run.status}
        return None
    finally:
        db.close()


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


def _persist_output(case_id: str, agent_name: str, output: AgentOutput) -> None:
    """Persist one agent's output. Runs on a worker thread.

    Only the compare-and-swap write is retried here (write_namespace already loops
    internally and raises WriteConflict when a parallel agent won the race). The
    expensive LLM generation that produced `output` must never be repeated just
    because the database write contended.
    """
    db = SessionLocal()
    try:
        write_namespace(db, case_id, agent_name, output.namespace, output.data)
    finally:
        db.close()


def _record_stage_start(case_id: str, stage: int, agents: list[str]) -> None:
    db = SessionLocal()
    try:
        audit_record(db, actor="Workflow Orchestrator", action="stage_started",
                     case_id=case_id, meta={"stage": stage, "agents": agents})
        case = db.get(ContractCase, case_id)
        if case is not None:
            case.current_stage = stage
            db.commit()
    finally:
        db.close()


def _record_stage_result(case_id: str, stage: int, status: str,
                         results: list[dict[str, Any]]) -> None:
    """Audit a finished stage and, on failure, escalate the case for human review.

    The escalation mutates contract_cases.payload, so it is itself a write: the
    version counter is bumped and a snapshot recorded, or the optimistic-lock
    sequence desyncs from the version history (issue 1).
    """
    db = SessionLocal()
    try:
        audit_record(db, actor="Workflow Orchestrator", action="stage_completed",
                     case_id=case_id, meta={"stage": stage, "status": status,
                                            "results": results})
        if status != "failed":
            return
        case = db.get(ContractCase, case_id)
        if case is None:
            return
        failed = [r for r in results if r["status"] == "failed"]
        case.status = "awaiting_review"
        payload = dict(case.payload or {})
        consensus = dict(payload.get("consensus") or {})
        reasons = list(consensus.get("escalationReasons") or [])
        reasons.append(f"agent failure in stage {stage}: "
                       f"{', '.join(f['agent'] for f in failed)}")
        consensus["escalationReasons"] = reasons
        payload["consensus"] = consensus
        case.payload = payload
        case.version += 1
        new_version = case.version
        db.commit()
        record_version(db, case_id, new_version, payload, source="orchestrator:escalation")
    finally:
        db.close()


def _finalise_pipeline(case_id: str) -> None:
    """After Stage 7 the case blocks at Stage 8 until a reviewer decides."""
    db = SessionLocal()
    try:
        case = db.get(ContractCase, case_id)
        if case is not None and case.status == "in_progress":
            case.status = "awaiting_review"
            case.current_stage = 8
            db.commit()
        audit_record(db, actor="Workflow Orchestrator", action="stage_started",
                     case_id=case_id, meta={"stage": 8, "agents": []})
    finally:
        db.close()


async def _run_agent(case_id: str, agent_name: str, stage: int) -> dict[str, Any]:
    existing = await asyncio.to_thread(_existing_run, case_id, agent_name)
    if existing is not None:
        log.info(
            "workflow trace case=%s stage=%s agent=%s event=agent_reused status=%s",
            case_id, stage, agent_name, existing["status"],
        )
        return existing

    snapshot = await asyncio.to_thread(_snapshot, case_id)

    if _should_skip(agent_name, snapshot):
        log.info(
            "workflow trace case=%s stage=%s agent=%s event=agent_skipped",
            case_id, stage, agent_name,
        )
        await asyncio.to_thread(_set_run, case_id, agent_name, stage, status="skipped",
                                completed_at=datetime.now(timezone.utc))
        await publish(case_id, {"type": "agent_status", "agent": agent_name,
                                "status": "skipped"})
        return {"agent": agent_name, "status": "skipped"}

    agent = get_agent(agent_name)
    task_payload = snapshot.get("_taskPayload", {}).get(agent_name, {})

    # Generation and persistence have separate retry budgets. Once the LLM call
    # succeeds, a WriteConflict (or any other persistence failure) re-attempts only
    # the database write with the already-generated output - never agent.run again.
    last_error: Exception | None = None
    output: AgentOutput | None = None
    for attempt in range(1, settings.node_max_retries + 1):
        log.info(
            "workflow trace case=%s stage=%s agent=%s event=agent_attempt_started attempt=%s",
            case_id, stage, agent_name, attempt,
        )
        await asyncio.to_thread(
            _set_run, case_id, agent_name, stage, status="running", attempt=attempt,
            started_at=datetime.now(timezone.utc), error=None,
        )
        await publish(case_id, {"type": "agent_status", "agent": agent_name,
                                "status": "running", "attempt": attempt})
        try:
            if output is None:
                output = await agent.run(
                    AgentInput(caseId=case_id, contractCaseSnapshot=snapshot,
                               taskPayload=task_payload)
                )
            await asyncio.to_thread(_persist_output, case_id, agent_name, output)
            log.info(
                "workflow trace case=%s stage=%s agent=%s event=agent_output_persisted "
                "namespace=%s confidence=%s",
                case_id, stage, agent_name, output.namespace, output.confidence,
            )
            break
        except Exception as exc:
            last_error = exc
            log.warning(
                "workflow trace case=%s stage=%s agent=%s event=agent_attempt_failed "
                "attempt=%s error=%s",
                case_id, stage, agent_name, attempt, exc,
            )
            if attempt < settings.node_max_retries:
                await asyncio.sleep(settings.node_backoff_base_seconds ** attempt)

    if last_error is not None or output is None:
        # output is None only when the retry loop never produced one (e.g. a
        # node_max_retries misconfiguration); treat that as a failure, not a crash.
        reason = last_error or Exception(
            "no generation attempt ran (node_max_retries must be >= 1)")
        await asyncio.to_thread(
            _set_run, case_id, agent_name, stage, status="failed",
            completed_at=datetime.now(timezone.utc), error=str(reason)[:2000],
        )
        await publish(case_id, {"type": "agent_status", "agent": agent_name,
                                "status": "failed", "error": str(reason)[:500]})
        log.info(
            "workflow trace case=%s stage=%s agent=%s event=agent_failed",
            case_id, stage, agent_name,
        )
        return {"agent": agent_name, "status": "failed", "error": str(reason)}

    await asyncio.to_thread(
        _set_run, case_id, agent_name, stage, status="completed",
        completed_at=datetime.now(timezone.utc), confidence_score=output.confidence,
    )
    await publish(case_id, {"type": "agent_status", "agent": agent_name,
                            "status": "completed", "confidence": output.confidence})
    log.info(
        "workflow trace case=%s stage=%s agent=%s event=agent_completed confidence=%s",
        case_id, stage, agent_name, output.confidence,
    )
    return {"agent": agent_name, "status": "completed"}


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

    if not await asyncio.to_thread(_dependencies_satisfied, case_id, stage):
        log.info(
            "workflow trace case=%s stage=%s event=stage_blocked dependencies=%s",
            case_id, stage, spec.depends_on,
        )
        return {"stage": stage, "status": "blocked"}

    log.info(
        "workflow trace case=%s stage=%s event=stage_started name=%s agents=%s parallel=%s",
        case_id, stage, spec.name, list(spec.agents), spec.parallel,
    )
    await asyncio.to_thread(_record_stage_start, case_id, stage, list(spec.agents))

    await publish(case_id, {"type": "stage", "stage": stage, "name": spec.name,
                            "status": "started"})

    if spec.parallel and settings.parallel_stages:
        results = await asyncio.gather(
            *[_run_agent(case_id, agent, stage) for agent in spec.agents]
        )
    else:
        results = [await _run_agent(case_id, agent, stage) for agent in spec.agents]

    failed = [r for r in results if r["status"] == "failed"]
    status = "failed" if failed else "completed"

    await asyncio.to_thread(_record_stage_result, case_id, stage, status, results)

    await publish(case_id, {"type": "stage", "stage": stage, "status": status})
    log.info(
        "workflow trace case=%s stage=%s event=stage_finished status=%s results=%s",
        case_id, stage, status, results,
    )
    return {"stage": stage, "status": status, "results": results}


async def finalise_pipeline(case_id: str) -> None:
    await asyncio.to_thread(_finalise_pipeline, case_id)
    await publish(case_id, {"type": "stage", "stage": 8, "status": "awaiting_review"})
    log.info("workflow trace case=%s stage=8 event=human_review_waiting", case_id)
