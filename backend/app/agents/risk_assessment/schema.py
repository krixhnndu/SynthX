from typing import Literal
from pydantic import BaseModel, Field

Severity = Literal["low", "medium", "high", "critical"]


class RiskFindingOut(BaseModel):
    clause_ref: str
    riskType: str
    severity: Severity
    confidence: float
    financialImpact: str
    businessImpact: str
    rationale: str
    evidenceCitation: str | None = None


class RiskOutput(BaseModel):
    findings: list[RiskFindingOut] = Field(default_factory=list)
    riskScore: float
