"""Common agent contract - master prompt section 8.

    AgentInput  { caseId, contractCaseSnapshot }
    AgentOutput { namespace, data, confidence?, evidenceRefs? }

Every specialist subclasses BaseAgent, declares its namespace and prompt file, and
implements run(). No agent imports another agent (section 11, Maintainability).
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

log = logging.getLogger(__name__)


class AgentInput(BaseModel):
    caseId: str
    contractCaseSnapshot: dict[str, Any]
    taskPayload: dict[str, Any] = Field(default_factory=dict)


class AgentOutput(BaseModel):
    namespace: str
    data: Any
    confidence: float | None = None
    evidenceRefs: list[str] = Field(default_factory=list)


class BaseAgent(ABC):
    name: str            # matches agent_runs.agent_name
    namespace: str       # the one Contract Case key this agent may write
    stage: int
    prompt_file: str = "prompt.md"

    def load_prompt(self) -> str:
        return (Path(__file__).parent / self.name / self.prompt_file).read_text()

    @abstractmethod
    async def run(self, payload: AgentInput) -> AgentOutput: ...

    def slice_case(self, snapshot: dict[str, Any], keys: list[str]) -> dict[str, Any]:
        """Agents read only the Contract Case fields they need."""
        return {k: snapshot.get(k) for k in keys if k in snapshot}
