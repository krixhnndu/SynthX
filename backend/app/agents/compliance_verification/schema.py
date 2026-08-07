from typing import Literal
from pydantic import BaseModel, Field


class ComplianceFindingOut(BaseModel):
    clause_ref: str
    framework: str
    result: Literal["pass", "fail", "uncertain"]
    citation: str
    detail: str


class ComplianceOutput(BaseModel):
    findings: list[ComplianceFindingOut] = Field(default_factory=list)
    frameworksChecked: list[str] = Field(default_factory=list)
