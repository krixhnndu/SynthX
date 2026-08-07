"""Cross-Document Comparison Agent - master prompt section 8.7 (Stage 3, conditional).

Runs only when a prior version or template was supplied at upload. Otherwise the
orchestrator marks it skipped (not failed) so Stage 4 resolution proceeds.
"""
import json

from app.agents.base import AgentInput, AgentOutput, BaseAgent
from app.agents.cross_document_comparison.schema import ComparisonOutput
from app.llm.structured import call_structured
from app.storage.base import get_storage
from app.agents.ocr_parsing.extractors import detect_and_extract


class CrossDocumentComparisonAgent(BaseAgent):
    name = "cross_document_comparison"
    namespace = "comparison"
    stage = 3

    async def run(self, payload: AgentInput) -> AgentOutput:
        document = payload.contractCaseSnapshot.get("document", {})
        comparison_ref = document.get("comparisonFileRef")
        if not comparison_ref:
            return AgentOutput(
                namespace="comparison",
                data=ComparisonOutput(skipped=True).model_dump(),
                confidence=1.0,
            )

        prior_bytes = get_storage().get(comparison_ref)
        _, prior_text, _ = detect_and_extract(
            prior_bytes, payload.taskPayload.get("comparisonFilename", "prior.pdf")
        )
        current = payload.contractCaseSnapshot.get("clauseClassification", {})

        result = await call_structured(
            self.load_prompt(),
            f"CURRENT CONTRACT (classified):\n{json.dumps(current)[:50000]}\n\n"
            f"PRIOR VERSION / TEMPLATE:\n{prior_text[:50000]}",
            ComparisonOutput,
            long_context=True,
        )
        return AgentOutput(namespace="comparison", data=result.model_dump(), confidence=0.9)
