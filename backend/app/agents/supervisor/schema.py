from typing import Any
from pydantic import BaseModel, Field


class ScopeOutput(BaseModel):
    contractType: str
    jurisdiction: str | None = None
    frameworks: list[str] = Field(default_factory=list)
    agentsSelected: list[str] = Field(default_factory=list)
    notes: str | None = None


class Conflict(BaseModel):
    between: list[str]
    description: str


class Resolution(BaseModel):
    conflict: str
    resolution: str
    rationale: str


class ConsensusOutput(BaseModel):
    finalRecommendation: str
    conflicts: list[Conflict] = Field(default_factory=list)
    resolutions: list[Resolution] = Field(default_factory=list)
    escalationReasons: list[str] = Field(default_factory=list)
    confidence: float
