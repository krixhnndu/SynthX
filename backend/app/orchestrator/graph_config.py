"""Static stage graph - master prompt section 7.

Declared as data, never inferred at runtime, so dependency management stays auditable.
"""
from dataclasses import dataclass, field


@dataclass(frozen=True)
class StageSpec:
    number: int
    name: str
    agents: tuple[str, ...]
    depends_on: tuple[int, ...] = field(default_factory=tuple)
    parallel: bool = False
    blocking_human: bool = False


STAGES: tuple[StageSpec, ...] = (
    StageSpec(1, "OCR & Document Parsing", ("ocr_parsing",)),
    StageSpec(2, "Clause Classification", ("clause_classification",), depends_on=(1,)),
    StageSpec(
        3, "Risk, Compliance & Comparison",
        ("risk_assessment", "compliance_verification", "cross_document_comparison"),
        depends_on=(2,), parallel=True,
    ),
    StageSpec(
        4, "Recommendation & Negotiation",
        ("recommendation", "negotiation_strategy"),
        depends_on=(3,), parallel=True,
    ),
    StageSpec(5, "Supervisor Consensus", ("supervisor",), depends_on=(4,)),
    StageSpec(6, "Explainability", ("explainability",), depends_on=(5,)),
    StageSpec(7, "Report Generation", ("report_generation",), depends_on=(6,)),
    StageSpec(8, "Human Review", (), depends_on=(7,), blocking_human=True),
)

STAGE_BY_NUMBER = {s.number: s for s in STAGES}
AGENT_STAGE = {agent: s.number for s in STAGES for agent in s.agents}

# Conditionally skipped when no prior version / template was supplied at upload.
CONDITIONAL_AGENTS = {"cross_document_comparison"}

# Statuses that satisfy a dependency. A skipped node must not block Stage 4.
SATISFYING_STATUSES = {"completed", "skipped"}
