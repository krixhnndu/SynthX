"""Report Generation Agent - master prompt section 8.12 (Stage 7).

Refuses to finalise a report missing the explainability section (section 11).
"""
import json
import logging
from datetime import datetime, timezone

from app.agents.base import AgentInput, AgentOutput, BaseAgent
from app.agents.report_generation.renderer import render_pdf
from app.agents.report_generation.schema import REPORT_SECTIONS, ReportOutput
from app.llm.structured import call_structured
from app.storage.base import get_storage

log = logging.getLogger(__name__)


class ReportGenerationAgent(BaseAgent):
    name = "report_generation"
    namespace = "report"
    stage = 7

    async def run(self, payload: AgentInput) -> AgentOutput:
        snapshot = payload.contractCaseSnapshot
        if not snapshot.get("explainability", {}).get("justifications"):
            raise RuntimeError("report generation blocked: explainability section is missing")

        result = await call_structured(
            self.load_prompt() + f"\n\nRequired sections:\n" + "\n".join(REPORT_SECTIONS),
            json.dumps(snapshot)[:90000],
            ReportOutput,
            long_context=True,
        )

        missing = result.missing()
        if missing:
            raise RuntimeError(f"report incomplete, missing sections: {missing}")

        # PDF render is best-effort: WeasyPrint needs GTK/Pango system libraries that
        # are absent on some platforms (e.g. a bare Windows venv). A missing renderer
        # must not lose the report - the HTML sections are the report; the PDF is a
        # download convenience and renderRef is simply omitted when it can't render.
        render_ref = None
        try:
            pdf_bytes = render_pdf(payload.caseId, result.sections)
            render_ref = get_storage().put(
                f"reports/{payload.caseId}.pdf", pdf_bytes, content_type="application/pdf"
            )
        except Exception as exc:
            log.warning("PDF render skipped for case %s (WeasyPrint/GTK unavailable?): %s",
                        payload.caseId, exc)

        return AgentOutput(
            namespace="report",
            data={
                "sections": result.sections,
                "generatedAt": datetime.now(timezone.utc).isoformat(),
                "renderRef": render_ref,
            },
            confidence=1.0,
        )
