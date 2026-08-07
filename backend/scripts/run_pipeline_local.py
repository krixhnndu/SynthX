"""Run the full LangGraph pipeline for one case directly - no Redis, no arq worker.

The production path enqueues "run_pipeline" onto Redis and an arq worker executes it.
For a local venv without Redis, this invokes the exact same graph the worker calls
(app/workers/tasks.py::run_pipeline) in-process. The agents hit the Groq API, write
their namespaces to SQLite, and the report lands in the case payload.

Usage (from backend/):
    python scripts/run_pipeline_local.py                 # list in_progress cases
    python scripts/run_pipeline_local.py <case_id>       # run the pipeline for it
"""
import asyncio
import sys

from sqlalchemy import select

from app.db.models import ContractCase
from app.db.session import SessionLocal
from app.orchestrator.graph import get_graph
from app.orchestrator.runner import finalise_pipeline


def list_in_progress() -> list[tuple[str, str]]:
    db = SessionLocal()
    try:
        rows = db.execute(
            select(ContractCase.id, ContractCase.created_at)
            .where(ContractCase.status == "in_progress")
            .order_by(ContractCase.created_at.desc())
        ).all()
        return [(r[0], r[1].isoformat() if r[1] else "?") for r in rows]
    finally:
        db.close()


async def run(case_id: str) -> None:
    print(f"running pipeline for {case_id} ...")
    await get_graph().ainvoke({"case_id": case_id, "stage": 0, "failed_stages": []})
    await finalise_pipeline(case_id)
    print("pipeline finished; case is now awaiting_review (stage 8)")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        asyncio.run(run(sys.argv[1]))
    else:
        cases = list_in_progress()
        if not cases:
            print("no in_progress cases; pass a case id: "
                  "python scripts/run_pipeline_local.py <case_id>")
        else:
            print("in_progress cases:")
            for cid, created in cases:
                print(f"  {cid}   (created {created})")
            print("re-run with a case id to execute it")
