"""Negotiation Strategy Agent - master prompt section 8.10 (Stage 4, parallel).

Runs concurrently with the Recommendation Agent on the same Stage 3 inputs.
"""
import json

from app.agents.base import AgentInput, AgentOutput, BaseAgent
from app.agents.negotiation_strategy.schema import NegotiationOutput
from app.llm.structured import call_structured


class NegotiationStrategyAgent(BaseAgent):
    name = "negotiation_strategy"
    namespace = "negotiationStrategy"
    stage = 4

    async def run(self, payload: AgentInput) -> AgentOutput:
        context = self.slice_case(
            payload.contractCaseSnapshot,
            ["risk", "compliance", "comparison", "legalEvidence", "reviewScope"],
        )
        result = await call_structured(
            self.load_prompt(),
            json.dumps(context)[:60000],
            NegotiationOutput,
            long_context=True,
        )
        return AgentOutput(
            namespace="negotiationStrategy", data=result.model_dump(), confidence=0.85
        )
