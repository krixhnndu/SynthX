from pydantic import BaseModel

# Exactly the sections named in master prompt section 8.12. Order is the report order.
REPORT_SECTIONS = [
    "Executive Summary",
    "Contract Summary",
    "Contract Overview",
    "Key Obligations",
    "Timeline",
    "Clause Classification",
    "Risk Assessment",
    "Compliance Report",
    "Contract Comparison",
    "Recommended Clause Improvements",
    "Negotiation Strategy",
    "Supporting Legal References",
    "Explainability",
    "Final Enterprise Recommendation",
]


class ReportOutput(BaseModel):
    sections: dict[str, str]

    def missing(self) -> list[str]:
        return [s for s in REPORT_SECTIONS if s not in self.sections]
