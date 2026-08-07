"""OCR & Document Parsing Agent - master prompt section 8.3 (Stage 1)."""
from app.agents.base import AgentInput, AgentOutput, BaseAgent
from app.agents.ocr_parsing.extractors import detect_and_extract
from app.agents.ocr_parsing.schema import StructureOutput
from app.llm.structured import call_structured
from app.storage.base import get_storage


class OcrParsingAgent(BaseAgent):
    name = "ocr_parsing"
    namespace = "document"
    stage = 1

    async def run(self, payload: AgentInput) -> AgentOutput:
        document = payload.contractCaseSnapshot.get("document", {})
        file_ref = document.get("originalFileRef")
        filename = payload.taskPayload.get("filename", "contract.pdf")

        raw_bytes = get_storage().get(file_ref)
        source_format, raw_text, confidence = detect_and_extract(raw_bytes, filename)

        structured = await call_structured(
            self.load_prompt(),
            raw_text[:120000],
            StructureOutput,
            long_context=True,
        )

        return AgentOutput(
            namespace="document",
            data={
                **document,
                "sourceFormat": source_format,
                "structuredContract": structured.model_dump(),
            },
            confidence=confidence,
        )
