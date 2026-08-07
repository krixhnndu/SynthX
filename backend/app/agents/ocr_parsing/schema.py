from typing import Any
from pydantic import BaseModel, Field


class ParsedClause(BaseModel):
    id: str
    heading: str | None = None
    text: str
    sectionRef: str | None = None


class StructureOutput(BaseModel):
    sections: list[dict[str, Any]] = Field(default_factory=list)
    clauses: list[ParsedClause] = Field(default_factory=list)
    tables: list[dict[str, Any]] = Field(default_factory=list)
    signatureBlocks: list[dict[str, Any]] = Field(default_factory=list)
    annexures: list[dict[str, Any]] = Field(default_factory=list)
