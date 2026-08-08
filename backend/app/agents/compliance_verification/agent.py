"""Compliance Verification Agent - master prompt section 8.6 (Stage 3, parallel)."""
import json

from app.agents.base import AgentInput, AgentOutput, BaseAgent
from app.agents.compliance_verification.schema import ComplianceOutput
from app.knowledge.service import query_legal_knowledge
from app.llm.structured import call_structured


class ComplianceVerificationAgent(BaseAgent):
    name = "compliance_verification"
    namespace = "compliance"
    stage = 3

    async def run(self, payload: AgentInput) -> AgentOutput:
        context = self.slice_case(
            payload.contractCaseSnapshot, ["clauseClassification", "reviewScope"]
        )
        frameworks = context.get("reviewScope", {}).get("frameworks") or ["internal playbook"]

        evidence = []
        for framework in frameworks:
            evidence.extend(
                await query_legal_knowledge(
                    case_id=payload.caseId,
                    question=f"Requirements under {framework} relevant to this contract's clauses",
                    requested_by_agent=self.name,
                    source_types=["regulation", "policy"],
                )
            )

        # Runs on the 8b (no long_context): findings output is bounded, so a trimmed
        # input fits the ~6K request cap and draws from the 8b's separate daily bucket.
        result = await call_structured(
            self.load_prompt(),
            f"Frameworks in scope: {frameworks}\n\n"
            f"Clauses:\n{json.dumps(context)[:10000]}\n\n"
            f"Retrieved evidence:\n{json.dumps(evidence)[:4000]}",
            ComplianceOutput,
        )
        return AgentOutput(
            namespace="compliance",
            data=result.model_dump(),
            confidence=1.0 if result.findings else 0.0,
            evidenceRefs=[e.get("documentId", "") for e in evidence],
        )
