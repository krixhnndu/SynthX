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
        # Runs on the 8b (no long_context): points output is bounded, so a trimmed
        # input fits the ~6K request cap and draws from the 8b's separate daily bucket.
        result = await call_structured(
            self.load_prompt(),
            json.dumps(context)[:11000],
            NegotiationOutput,
        )
        return AgentOutput(
            namespace="negotiationStrategy", data=result.model_dump(), confidence=0.85
        )
