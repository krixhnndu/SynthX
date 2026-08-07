"""Clause Classification Agent - master prompt section 8.4 (Stage 2).

One LLM call producing multi-part structured output covering segmentation,
type classification, NER, obligations and timeline.
"""
import json

from app.agents.base import AgentInput, AgentOutput, BaseAgent
from app.agents.clause_classification.schema import ClassificationOutput
from app.llm.structured import call_structured


class ClauseClassificationAgent(BaseAgent):
    name = "clause_classification"
    namespace = "clauseClassification"
    stage = 2

    async def run(self, payload: AgentInput) -> AgentOutput:
        structured = payload.contractCaseSnapshot.get("document", {}).get("structuredContract", {})
        result = await call_structured(
            self.load_prompt(),
            json.dumps(structured)[:120000],
            ClassificationOutput,
            long_context=True,
        )
        clauses = result.clauses
        confidence = round(sum(c.confidence for c in clauses) / len(clauses), 3) if clauses else 0.0
        return AgentOutput(
            namespace="clauseClassification", data=result.model_dump(), confidence=confidence
        )
