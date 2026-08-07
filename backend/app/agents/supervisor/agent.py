"""Supervisor Agent - master prompt section 8.1.

Invoked twice per case: at creation (scope) and after Stage 4 (consensus).
Resolved as a graph node for Stage 5 so it inherits retry and agent_runs bookkeeping
(docs/OPEN_DECISIONS.md, gap 3).
"""
import json

from app.agents.base import AgentInput, AgentOutput, BaseAgent
from app.agents.supervisor.schema import ConsensusOutput, ScopeOutput
from app.llm.structured import call_structured


class SupervisorAgent(BaseAgent):
    name = "supervisor"
    namespace = "consensus"
    stage = 5

    async def run(self, payload: AgentInput) -> AgentOutput:
        mode = payload.taskPayload.get("mode", "consensus")
        if mode == "scope":
            return await self._scope(payload)
        return await self._consensus(payload)

    async def _scope(self, payload: AgentInput) -> AgentOutput:
        context = self.slice_case(payload.contractCaseSnapshot, ["document"])
        excerpt = json.dumps(context)[:12000]
        result = await call_structured(
            self.load_prompt() + "\n\nOperate in Scope mode.",
            f"Requester role: {payload.taskPayload.get('requesterRoles')}\n"
            f"Prior version supplied: {payload.taskPayload.get('hasComparisonDoc', False)}\n"
            f"Document:\n{excerpt}",
            ScopeOutput,
        )
        return AgentOutput(namespace="reviewScope", data=result.model_dump(), confidence=1.0)

    async def _consensus(self, payload: AgentInput) -> AgentOutput:
        context = self.slice_case(
            payload.contractCaseSnapshot,
            ["risk", "compliance", "comparison", "legalEvidence",
             "recommendations", "negotiationStrategy", "reviewScope"],
        )
        result = await call_structured(
            self.load_prompt() + "\n\nOperate in Consensus mode.",
            json.dumps(context)[:60000],
            ConsensusOutput,
            long_context=True,
        )
        return AgentOutput(
            namespace="consensus", data=result.model_dump(), confidence=result.confidence
        )
