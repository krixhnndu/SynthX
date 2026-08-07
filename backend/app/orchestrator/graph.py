"""LangGraph state graph over the static stage config.

Each stage is a node. Stages marked parallel dispatch their agents concurrently as
separate async tasks (master prompt section 11, Performance).
"""
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from app.orchestrator.graph_config import STAGES, STAGE_BY_NUMBER
from app.orchestrator.runner import run_stage


class PipelineState(TypedDict, total=False):
    case_id: str
    stage: int
    failed_stages: list[int]
    halted: bool


def _make_node(stage_number: int):
    async def node(state: PipelineState) -> PipelineState:
        result = await run_stage(state["case_id"], stage_number)
        failed = list(state.get("failed_stages", []))
        halted = result["status"] in ("failed", "blocked")
        if halted:
            failed.append(stage_number)
        return {**state, "stage": stage_number, "failed_stages": failed,
                "halted": halted}
    return node


def build_graph():
    graph = StateGraph(PipelineState)

    pipeline_stages = [s for s in STAGES if not s.blocking_human]
    for spec in pipeline_stages:
        graph.add_node(f"stage_{spec.number}", _make_node(spec.number))

    graph.set_entry_point("stage_1")

    for index, spec in enumerate(pipeline_stages):
        current = f"stage_{spec.number}"
        is_last = index == len(pipeline_stages) - 1
        nxt = END if is_last else f"stage_{pipeline_stages[index + 1].number}"

        def _route(state: PipelineState, _next=nxt):
            # A failed or blocked branch halts the pipeline; the Supervisor flags the
            # case for human review rather than completing on partial data (section 7).
            return END if state.get("halted") else _next

        graph.add_conditional_edges(current, _route)

    return graph.compile()


COMPILED_GRAPH = None


def get_graph():
    global COMPILED_GRAPH
    if COMPILED_GRAPH is None:
        COMPILED_GRAPH = build_graph()
    return COMPILED_GRAPH
