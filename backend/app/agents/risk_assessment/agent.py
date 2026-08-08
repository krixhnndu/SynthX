"""Risk Assessment Agent - master prompt section 8.5 (Stage 3, parallel)."""
import json

from app.agents.base import AgentInput, AgentOutput, BaseAgent
from app.agents.risk_assessment.schema import RiskOutput
from app.knowledge.service import query_legal_knowledge
from app.llm.structured import call_structured


class RiskAssessmentAgent(BaseAgent):
    name = "risk_assessment"
    namespace = "risk"
    stage = 3

    async def run(self, payload: AgentInput) -> AgentOutput:
        context = self.slice_case(
            payload.contractCaseSnapshot, ["clauseClassification", "reviewScope"]
        )

        evidence = await query_legal_knowledge(
            case_id=payload.caseId,
            question=(
                "Precedent and internal policy on liability caps, indemnity scope and "
                "termination rights for contract type: "
                f"{context.get('reviewScope', {}).get('contractType', 'unknown')}"
            ),
            requested_by_agent=self.name,
            source_types=["precedent", "policy", "template"],
        )

        # Runs on the 8b (no long_context): findings output is bounded, so a trimmed
        # input fits the ~6K request cap and draws from the 8b's separate daily bucket.
        result = await call_structured(
            self.load_prompt(),
            f"Contract structure:\n{json.dumps(context)[:10000]}\n\n"
            f"Retrieved legal evidence:\n{json.dumps(evidence)[:4000]}",
            RiskOutput,
        )

        findings = result.findings
        confidence = round(sum(f.confidence for f in findings) / len(findings), 3) if findings else 0.0
        return AgentOutput(
            namespace="risk",
            data=result.model_dump(),
            confidence=confidence,
            evidenceRefs=[e.get("documentId", "") for e in evidence],
        )
