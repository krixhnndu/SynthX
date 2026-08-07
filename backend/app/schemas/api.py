from typing import Any, Literal
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    roles: list[str]


class RefreshRequest(BaseModel):
    refresh_token: str


class CaseSummary(BaseModel):
    caseId: str
    status: str
    filename: str | None
    riskScore: float | None
    currentStage: int
    createdAt: Any


class ReviewSubmission(BaseModel):
    decision: Literal["approve", "request_changes", "reject"]
    comment: str | None = None


class IngestRequest(BaseModel):
    source_type: Literal["policy", "regulation", "precedent", "template", "historical_contract"]
    title: str
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class KnowledgeQuery(BaseModel):
    question: str
    requested_by_agent: str
    source_types: list[str] = Field(default_factory=list)
    top_k: int | None = None
