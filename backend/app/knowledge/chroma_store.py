"""ChromaDB vector store. Embeddings are keyed to legal_knowledge_documents.id;
no embedding column lives in the relational database (master prompt section 6)."""
from functools import lru_cache
from typing import Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings
from app.knowledge.embeddings import embed


@lru_cache
def get_collection():
    # Embedded (default, local dir) or an external Chroma server. The http mode
    # is the multi-instance path; it is config-ready but not yet tested/deployed.
    if settings.chroma_backend == "http":
        client = chromadb.HttpClient(
            host=settings.chroma_host, port=settings.chroma_port,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    else:
        client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return client.get_or_create_collection(
        name=settings.chroma_collection, metadata={"hnsw:space": "cosine"}
    )


def add_chunks(document_id: str, source_type: str, title: str,
               chunks: list[str], extra: dict[str, Any] | None = None) -> int:
    collection = get_collection()
    ids = [f"{document_id}:{i}" for i in range(len(chunks))]
    metadatas = [
        {"document_id": document_id, "source_type": source_type, "title": title,
         "chunk_index": i, **(extra or {})}
        for i in range(len(chunks))
    ]
    collection.add(ids=ids, documents=chunks, embeddings=embed(chunks), metadatas=metadatas)
    return len(chunks)


def similarity_search(question: str, source_types: list[str] | None = None,
                      top_k: int | None = None) -> list[dict[str, Any]]:
    collection = get_collection()
    where = {"source_type": {"$in": source_types}} if source_types else None
    result = collection.query(
        query_embeddings=embed([question]),
        n_results=top_k or settings.rag_top_k,
        where=where,
    )
    hits = []
    for i in range(len(result["ids"][0])):
        hits.append({
            "chunk_id": result["ids"][0][i],
            "content": result["documents"][0][i],
            "metadata": result["metadatas"][0][i],
            "score": 1 - result["distances"][0][i],
        })
    return hits
