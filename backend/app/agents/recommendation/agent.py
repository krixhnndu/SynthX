"""Recommendation Agent - master prompt section 8.9 (Stage 4, parallel)."""
import json

from app.agents.base import AgentInput, AgentOutput, BaseAgent
from app.agents.recommendation.schema import RecommendationOutput
from app.knowledge.service import query_legal_knowledge
from app.llm.structured import call_structured


class RecommendationAgent(BaseAgent):
    name = "recommendation"
    namespace = "recommendations"
    stage = 4

    async def run(self, payload: AgentInput) -> AgentOutput:
        context = self.slice_case(
            payload.contractCaseSnapshot,
            ["risk", "compliance", "comparison", "legalEvidence", "clauseClassification"],
        )

        evidence = await query_legal_knowledge(
            case_id=payload.caseId,
            question="Approved clause templates and preferred wording for the flagged clause types",
            requested_by_agent=self.name,
            source_types=["template", "policy"],
        )

        result = await call_structured(
            self.load_prompt(),
            f"Findings:\n{json.dumps(context)[:55000]}\n\n"
            f"Approved templates:\n{json.dumps(evidence)[:15000]}",
            RecommendationOutput,
            long_context=True,
        )
        return AgentOutput(
            namespace="recommendations",
            data=result.model_dump(),
            confidence=0.85,
            evidenceRefs=[e.get("documentId", "") for e in evidence],
        )
