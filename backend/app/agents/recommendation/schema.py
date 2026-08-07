from typing import Literal
from pydantic import BaseModel, Field


class ClauseRewrite(BaseModel):
    clause_ref: str
    currentText: str
    proposedText: str
    reason: str
    addressesRisk: list[str] = Field(default_factory=list)
    evidenceCitation: str | None = None
    priority: Literal["low", "medium", "high"]


class Redline(BaseModel):
    clause_ref: str
    operation: Literal["insert", "delete", "replace"]
    startOffset: int
    endOffset: int
    text: str


class RecommendationOutput(BaseModel):
    clauseRewrites: list[ClauseRewrite] = Field(default_factory=list)
    redlines: list[Redline] = Field(default_factory=list)
