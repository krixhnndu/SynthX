"""Corpus ingestion: chunk -> embed -> store. Admin-only entry point."""
import re

from sqlalchemy.orm import Session

from app.core.crypto import encrypt
from app.db.models import LegalKnowledgeDocument
from app.knowledge.chroma_store import add_chunks

CHUNK_CHARS = 1200
CHUNK_OVERLAP = 150


def chunk_text(text: str) -> list[str]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks, current = [], ""
    for para in paragraphs:
        if len(current) + len(para) + 2 <= CHUNK_CHARS:
            current = f"{current}\n\n{para}".strip()
        else:
            if current:
                chunks.append(current)
            current = (current[-CHUNK_OVERLAP:] + "\n\n" + para).strip() if current else para
    if current:
        chunks.append(current)
    return chunks


def ingest_document(db: Session, *, source_type: str, title: str, content: str,
                    metadata: dict | None = None) -> tuple[str, int]:
    record = LegalKnowledgeDocument(
        source_type=source_type, title=title,
        content=encrypt(content), meta=metadata or {},
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    chunks = chunk_text(content)
    count = add_chunks(record.id, source_type, title, chunks)
    return record.id, count
