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

        result = await call_structured(
            self.load_prompt(),
            f"Frameworks in scope: {frameworks}\n\n"
            f"Clauses:\n{json.dumps(context)[:50000]}\n\n"
            f"Retrieved evidence:\n{json.dumps(evidence)[:20000]}",
            ComplianceOutput,
            long_context=True,
        )
        return AgentOutput(
            namespace="compliance",
            data=result.model_dump(),
            confidence=1.0 if result.findings else 0.0,
            evidenceRefs=[e.get("documentId", "") for e in evidence],
        )
