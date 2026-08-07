"""Contract Case object - master prompt section 5.

One namespace per agent. Agents write ONLY to their own top-level key; the
optimistic-locking helper in core/locking.py enforces that at write time.
"""
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

CaseStatus = Literal["in_progress", "awaiting_review", "approved", "changes_requested", "rejected"]
Severity = Literal["low", "medium", "high", "critical"]


class ReviewScope(BaseModel):
    requestedBy: str | None = None
    contractType: str | None = None
    jurisdiction: str | None = None
    frameworks: list[str] = Field(default_factory=list)
    agentsSelected: list[str] = Field(default_factory=list)
    notes: str | None = None


class Clause(BaseModel):
    id: str
    heading: str | None = None
    text: str
    sectionRef: str | None = None


class StructuredContract(BaseModel):
    sections: list[dict[str, Any]] = Field(default_factory=list)
    clauses: list[Clause] = Field(default_factory=list)
    tables: list[dict[str, Any]] = Field(default_factory=list)
    signatureBlocks: list[dict[str, Any]] = Field(default_factory=list)
    annexures: list[dict[str, Any]] = Field(default_factory=list)


class DocumentNS(BaseModel):
    originalFileRef: str = ""
    comparisonFileRef: str | None = None
    structuredContract: StructuredContract = Field(default_factory=StructuredContract)
    sourceFormat: Literal["pdf", "docx", "scanned", ""] = ""


class ClauseClassificationNS(BaseModel):
    clauses: list[dict[str, Any]] = Field(default_factory=list)
    entities: list[dict[str, Any]] = Field(default_factory=list)
    obligations: list[dict[str, Any]] = Field(default_factory=list)
    timeline: list[dict[str, Any]] = Field(default_factory=list)


class RiskFinding(BaseModel):
    clause_ref: str
    riskType: str
    severity: Severity
    confidence: float
    financialImpact: str | None = None
    businessImpact: str | None = None
    rationale: str | None = None


class RiskNS(BaseModel):
    findings: list[RiskFinding] = Field(default_factory=list)
    riskScore: float = 0.0


class ComplianceFinding(BaseModel):
    clause_ref: str
    framework: str
    result: Literal["pass", "fail", "uncertain"]
    citation: str | None = None
    detail: str | None = None


class ComplianceNS(BaseModel):
    findings: list[ComplianceFinding] = Field(default_factory=list)
    frameworksChecked: list[str] = Field(default_factory=list)


class ComparisonNS(BaseModel):
    added: list[dict[str, Any]] = Field(default_factory=list)
    deleted: list[dict[str, Any]] = Field(default_factory=list)
    modified: list[dict[str, Any]] = Field(default_factory=list)
    skipped: bool = False


class LegalEvidence(BaseModel):
    requestedByAgent: str
    sourceType: str
    content: str
    citation: str
    documentId: str | None = None
    score: float | None = None


class RecommendationsNS(BaseModel):
    clauseRewrites: list[dict[str, Any]] = Field(default_factory=list)
    redlines: list[dict[str, Any]] = Field(default_factory=list)


class NegotiationStrategyNS(BaseModel):
    points: list[dict[str, Any]] = Field(default_factory=list)


class ConsensusNS(BaseModel):
    finalRecommendation: str = ""
    conflicts: list[dict[str, Any]] = Field(default_factory=list)
    resolutions: list[dict[str, Any]] = Field(default_factory=list)
    escalationReasons: list[str] = Field(default_factory=list)
    confidence: float | None = None


class ExplainabilityNS(BaseModel):
    justifications: list[dict[str, Any]] = Field(default_factory=list)


class ReportNS(BaseModel):
    sections: dict[str, Any] = Field(default_factory=dict)
    generatedAt: str | None = None
    renderRef: str | None = None


class ReviewNS(BaseModel):
    assignedRoles: list[str] = Field(default_factory=list)
    decisions: list[dict[str, Any]] = Field(default_factory=list)
    comments: list[dict[str, Any]] = Field(default_factory=list)


class ContractCasePayload(BaseModel):
    caseId: str
    status: CaseStatus = "in_progress"
    createdBy: str
    createdAt: datetime | None = None
    version: int = 1
    reviewScope: ReviewScope = Field(default_factory=ReviewScope)
    document: DocumentNS = Field(default_factory=DocumentNS)
    clauseClassification: ClauseClassificationNS = Field(default_factory=ClauseClassificationNS)
    risk: RiskNS = Field(default_factory=RiskNS)
    compliance: ComplianceNS = Field(default_factory=ComplianceNS)
    comparison: ComparisonNS = Field(default_factory=ComparisonNS)
    legalEvidence: list[LegalEvidence] = Field(default_factory=list)
    recommendations: RecommendationsNS = Field(default_factory=RecommendationsNS)
    negotiationStrategy: NegotiationStrategyNS = Field(default_factory=NegotiationStrategyNS)
    consensus: ConsensusNS = Field(default_factory=ConsensusNS)
    explainability: ExplainabilityNS = Field(default_factory=ExplainabilityNS)
    report: ReportNS = Field(default_factory=ReportNS)
    review: ReviewNS = Field(default_factory=ReviewNS)
    auditLog: list[dict[str, Any]] = Field(default_factory=list)


# Namespace -> owning agent. Enforced on write.
NAMESPACE_OWNER = {
    "reviewScope": "supervisor",
    "document": "ocr_parsing",
    "clauseClassification": "clause_classification",
    "risk": "risk_assessment",
    "compliance": "compliance_verification",
    "comparison": "cross_document_comparison",
    "legalEvidence": "legal_knowledge",
    "recommendations": "recommendation",
    "negotiationStrategy": "negotiation_strategy",
    "consensus": "supervisor",
    "explainability": "explainability",
    "report": "report_generation",
    "review": "human_review",
}
