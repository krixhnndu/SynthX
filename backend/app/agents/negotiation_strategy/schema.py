from typing import Literal
from pydantic import BaseModel, Field


class NegotiationPoint(BaseModel):
    topic: Literal[
        "liability_cap", "payment_terms", "ip_ownership", "warranty",
        "dispute_resolution", "termination", "sla", "other",
    ]
    clause_ref: str | None = None
    openingPosition: str
    fallbackPosition: str
    walkAwayPosition: str | None = None
    rationale: str
    priority: Literal["low", "medium", "high"]


class NegotiationOutput(BaseModel):
    points: list[NegotiationPoint] = Field(default_factory=list)
