"""Shared Legal Knowledge Agent - master prompt section 8.8.

Not a graph node. A synchronous internal service called mid-execution by the Risk,
Compliance and Recommendation agents. Every call is logged to the audit trail and
appended to the case's legalEvidence namespace.
"""
import json
from typing import Any

from pydantic import BaseModel, Field

from app.config import settings
from app.core.audit import record as audit_record
from app.core.locking import append_legal_evidence
from app.db.session import SessionLocal
from app.knowledge.chroma_store import similarity_search
from app.llm.structured import call_structured

SYSTEM_PROMPT = """
You answer legal questions using only the retrieved passages supplied to you.

Synthesise a direct answer and cite the passages it rests on. Every claim you make must
trace to a passage. If the passages do not answer the question, say that they do not and
return an empty answer rather than filling the gap from general knowledge.

Do not soften a gap in the corpus into a confident answer. Downstream agents treat your
output as evidence, and unsupported evidence is worse than none.
"""


class Citation(BaseModel):
    documentId: str
    title: str
    sourceType: str
    excerpt: str


class KnowledgeAnswer(BaseModel):
    answer: str
    citations: list[Citation] = Field(default_factory=list)
    corpusCovered: bool


async def query_legal_knowledge(*, case_id: str, question: str, requested_by_agent: str,
                                source_types: list[str] | None = None,
                                top_k: int | None = None) -> list[dict[str, Any]]:
    hits = similarity_search(question, source_types, top_k or settings.rag_top_k)
    if not hits:
        _log(case_id, requested_by_agent, question, 0)
        return []

    passages = "\n\n---\n\n".join(
        f"[{h['metadata']['title']} | {h['metadata']['source_type']} | "
        f"doc:{h['metadata']['document_id']}]\n{h['content']}"
        for h in hits
    )
    answer = await call_structured(
        SYSTEM_PROMPT, f"Question: {question}\n\nRetrieved passages:\n{passages}", KnowledgeAnswer
    )

    evidence = [
        {
            "requestedByAgent": requested_by_agent,
            "sourceType": c.sourceType,
            "content": c.excerpt,
            "citation": c.title,
            "documentId": c.documentId,
            "score": next((h["score"] for h in hits
                           if h["metadata"]["document_id"] == c.documentId), None),
        }
        for c in answer.citations
    ]

    db = SessionLocal()
    try:
        for item in evidence:
            append_legal_evidence(db, case_id, item)
    finally:
        db.close()

    _log(case_id, requested_by_agent, question, len(evidence))
    return evidence


def _log(case_id: str, agent: str, question: str, hits: int) -> None:
    db = SessionLocal()
    try:
        audit_record(
            db, actor="Legal Knowledge Agent", action="knowledge_query", case_id=case_id,
            meta={"requestedByAgent": agent, "question": question[:500], "evidenceReturned": hits},
        )
    finally:
        db.close()
