"""Single place that maps agent_name -> class. The orchestrator resolves nodes here."""
from app.agents.base import BaseAgent
from app.agents.supervisor.agent import SupervisorAgent
from app.agents.ocr_parsing.agent import OcrParsingAgent
from app.agents.clause_classification.agent import ClauseClassificationAgent
from app.agents.risk_assessment.agent import RiskAssessmentAgent
from app.agents.compliance_verification.agent import ComplianceVerificationAgent
from app.agents.cross_document_comparison.agent import CrossDocumentComparisonAgent
from app.agents.recommendation.agent import RecommendationAgent
from app.agents.negotiation_strategy.agent import NegotiationStrategyAgent
from app.agents.explainability.agent import ExplainabilityAgent
from app.agents.report_generation.agent import ReportGenerationAgent

AGENT_REGISTRY: dict[str, type[BaseAgent]] = {
    SupervisorAgent.name: SupervisorAgent,
    OcrParsingAgent.name: OcrParsingAgent,
    ClauseClassificationAgent.name: ClauseClassificationAgent,
    RiskAssessmentAgent.name: RiskAssessmentAgent,
    ComplianceVerificationAgent.name: ComplianceVerificationAgent,
    CrossDocumentComparisonAgent.name: CrossDocumentComparisonAgent,
    RecommendationAgent.name: RecommendationAgent,
    NegotiationStrategyAgent.name: NegotiationStrategyAgent,
    ExplainabilityAgent.name: ExplainabilityAgent,
    ReportGenerationAgent.name: ReportGenerationAgent,
}


def get_agent(name: str) -> BaseAgent:
    cls = AGENT_REGISTRY.get(name)
    if cls is None:
        raise KeyError(f"unknown agent: {name}")
    return cls()
