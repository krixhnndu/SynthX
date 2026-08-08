"""Durable pipeline execution.

FastAPI BackgroundTasks cannot carry this workload - an in-process task dies with the
worker and cannot scale independently of the API, which contradicts the scalability and
reliability NFRs (docs/OPEN_DECISIONS.md, gap 1). Jobs run on an arq/Redis queue instead.
"""
import logging

from arq.connections import RedisSettings

from app.agents.base import AgentInput
from app.agents.registry import get_agent
from app.config import settings
from app.core.locking import write_namespace
from app.db.models import ContractCase
from app.db.session import SessionLocal
from app.orchestrator.graph import get_graph
from app.orchestrator.runner import finalise_pipeline

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


async def run_scope(ctx, case_id: str, requester_roles: list[str], has_comparison: bool) -> None:
    """Supervisor scope pass, on case creation (master prompt section 8.1)."""
    log.info(
        "workflow trace case=%s event=scope_started roles=%s has_comparison=%s",
        case_id, requester_roles, has_comparison,
    )
    db = SessionLocal()
    try:
        case = db.get(ContractCase, case_id)
        snapshot = dict(case.payload or {})
        log.info(
            "workflow trace case=%s event=scope_snapshot_loaded payload_keys=%s",
            case_id, sorted(snapshot.keys()),
        )
    finally:
        db.close()

    agent = get_agent("supervisor")
    output = await agent.run(AgentInput(
        caseId=case_id,
        contractCaseSnapshot=snapshot,
        taskPayload={"mode": "scope", "requesterRoles": requester_roles,
                     "hasComparisonDoc": has_comparison},
    ))
    db = SessionLocal()
    try:
        write_namespace(db, case_id, "supervisor", "reviewScope", output.data)
    finally:
        db.close()
    log.info("workflow trace case=%s event=scope_written namespace=reviewScope", case_id)

    await ctx["redis"].enqueue_job("run_pipeline", case_id)
    log.info("workflow trace case=%s event=pipeline_enqueued", case_id)


async def run_pipeline(ctx, case_id: str) -> None:
    log.info("workflow trace case=%s event=pipeline_started", case_id)
    result = await get_graph().ainvoke({"case_id": case_id, "stage": 0, "failed_stages": []})
    log.info("workflow trace case=%s event=pipeline_graph_finished result=%s", case_id, result)
    await finalise_pipeline(case_id)
    log.info("workflow trace case=%s event=pipeline_finalised", case_id)


class WorkerSettings:
    functions = [run_scope, run_pipeline]
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    max_jobs = 10
    job_timeout = 3600
