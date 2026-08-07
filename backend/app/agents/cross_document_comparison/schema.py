from pydantic import BaseModel, Field


class AddedClause(BaseModel):
    clause_ref: str
    text: str
    significance: str


class DeletedClause(BaseModel):
    clause_ref: str
    text: str
    significance: str


class ModifiedClause(BaseModel):
    clause_ref: str
    before: str
    after: str
    meaningChanged: bool
    effect: str


class ComparisonOutput(BaseModel):
    added: list[AddedClause] = Field(default_factory=list)
    deleted: list[DeletedClause] = Field(default_factory=list)
    modified: list[ModifiedClause] = Field(default_factory=list)
    skipped: bool = False
