from pydantic import BaseModel, Field


class Justification(BaseModel):
    decision: str
    clauseReferences: list[str] = Field(default_factory=list)
    legalRationale: str
    regulationsConsulted: list[str] = Field(default_factory=list)
    evidenceCitations: list[str] = Field(default_factory=list)
    contributingAgents: list[str] = Field(default_factory=list)
    confidence: float


class ExplainabilityOutput(BaseModel):
    justifications: list[Justification] = Field(default_factory=list)
