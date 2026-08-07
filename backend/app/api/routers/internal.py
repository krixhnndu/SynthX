from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, require
from app.core import rbac
from app.core.audit import record as audit_record
from app.db.session import get_db
from app.knowledge.ingest import ingest_document
from app.knowledge.service import query_legal_knowledge
from app.schemas.api import IngestRequest, KnowledgeQuery

router = APIRouter(prefix="/internal/legal-knowledge", tags=["legal-knowledge"])


@router.post("/ingest")
def ingest(
    body: IngestRequest,
    user: CurrentUser = Depends(require(rbac.RESOURCE_KNOWLEDGE, "ingest")),
    db: Session = Depends(get_db),
):
    document_id, chunks = ingest_document(
        db, source_type=body.source_type, title=body.title,
        content=body.content, metadata=body.metadata,
    )
    audit_record(db, actor=user.email, actor_id=user.id, action="knowledge_ingested",
                 meta={"documentId": document_id, "sourceType": body.source_type,
                       "chunks": chunks})
    return {"documentId": document_id, "chunks": chunks}


@router.post("/query")
async def query(
    body: KnowledgeQuery,
    user: CurrentUser = Depends(require(rbac.RESOURCE_KNOWLEDGE, "query")),
):
    evidence = await query_legal_knowledge(
        case_id=body.requested_by_agent, question=body.question,
        requested_by_agent=body.requested_by_agent,
        source_types=body.source_types or None, top_k=body.top_k,
    )
    return {"evidence": evidence}
