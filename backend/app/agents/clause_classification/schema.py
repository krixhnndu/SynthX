from typing import Literal
from pydantic import BaseModel, Field

ClauseType = Literal[
    "indemnity", "termination", "intellectual_property", "confidentiality", "payment",
    "liability", "warranty", "governing_law", "dispute_resolution", "force_majeure",
    "data_protection", "assignment", "audit", "insurance", "sla", "other",
]


class ClassifiedClause(BaseModel):
    id: str
    clauseType: ClauseType
    summary: str
    text: str
    confidence: float


class Entity(BaseModel):
    text: str
    type: Literal["organisation", "person", "amount", "date", "location", "other"]
    clause_ref: str | None = None


class Obligation(BaseModel):
    party: str
    obligation: str
    clause_ref: str
    dueBy: str | None = None


class TimelineItem(BaseModel):
    event: str
    date: str
    clause_ref: str


class ClassificationOutput(BaseModel):
    clauses: list[ClassifiedClause] = Field(default_factory=list)
    entities: list[Entity] = Field(default_factory=list)
    obligations: list[Obligation] = Field(default_factory=list)
    timeline: list[TimelineItem] = Field(default_factory=list)
