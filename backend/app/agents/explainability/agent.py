"""Explainability Agent - master prompt section 8.11 (Stage 6).

Runs only after Stage 5 so it explains the final decision, never an interim one.
Mandatory: Report Generation refuses to finalise without this namespace.
"""
import json

from app.agents.base import AgentInput, AgentOutput, BaseAgent
from app.agents.explainability.schema import ExplainabilityOutput
from app.llm.structured import call_structured


class ExplainabilityAgent(BaseAgent):
    name = "explainability"
    namespace = "explainability"
    stage = 6

    async def run(self, payload: AgentInput) -> AgentOutput:
        snapshot = payload.contractCaseSnapshot
        consensus = snapshot.get("consensus", {})
        if not consensus.get("finalRecommendation"):
            raise RuntimeError("explainability requires a completed Stage 5 consensus")

        context = self.slice_case(
            snapshot,
            ["consensus", "risk", "compliance", "comparison", "legalEvidence",
             "recommendations", "negotiationStrategy", "clauseClassification"],
        )
        result = await call_structured(
            self.load_prompt(),
            json.dumps(context)[:70000],
            ExplainabilityOutput,
            long_context=True,
        )
        return AgentOutput(
            namespace="explainability", data=result.model_dump(), confidence=1.0
        )
