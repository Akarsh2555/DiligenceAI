"""
VectorStoreManager — Supabase pgvector backend with per-session isolation.

Vectors live in Postgres (table `document_embeddings`), filtered by a
`session_id` stored in each row's metadata. This replaces the previous local
ChromaDB store, which loaded onnxruntime into memory (OOM-prone on small hosts)
and persisted to ephemeral disk (lost on restart).

The public async interface is unchanged so callers (retrieval, ingestion graph,
session delete) need no changes.
"""

import asyncio
from typing import Optional

from langchain_community.vectorstores import SupabaseVectorStore
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from backend.database import get_supabase_client
from backend.ingestion.embedder import get_embedding_model

TABLE_NAME = "document_embeddings"
QUERY_NAME = "match_document_embeddings"


class VectorStoreManager:
    """Manages document embeddings in Supabase pgvector, namespaced by session."""

    def __init__(self, embedding_model: Optional[Embeddings] = None):
        self.embedding_model = embedding_model or get_embedding_model()
        self.client = get_supabase_client()
        self.store = SupabaseVectorStore(
            client=self.client,
            embedding=self.embedding_model,
            table_name=TABLE_NAME,
            query_name=QUERY_NAME,
        )

    async def add_documents(
        self,
        session_id: str,
        documents: list[Document],
        batch_size: int = 16,
    ) -> list[str]:
        """Embed and store documents, tagging each with the session_id."""
        for doc in documents:
            doc.metadata["session_id"] = session_id

        all_ids: list[str] = []
        for i in range(0, len(documents), batch_size):
            batch = documents[i : i + batch_size]
            ids = await asyncio.to_thread(self.store.add_documents, batch)
            all_ids.extend(ids)
        return all_ids

    async def similarity_search_with_scores(
        self,
        session_id: str,
        query: str,
        k: int = 6,
        filter: Optional[dict] = None,
    ) -> list[tuple[Document, float]]:
        """
        Per-session similarity search. Returns (Document, distance) tuples where
        LOWER distance = more relevant, matching the convention retrieval.py
        expects (it sorts ascending and computes 1/(1+distance)).
        """
        meta_filter = {"session_id": session_id}
        if filter:
            meta_filter.update(filter)

        def _run() -> list[tuple[Document, float]]:
            query_embedding = self.embedding_model.embed_query(query)
            res = self.client.rpc(
                QUERY_NAME,
                {
                    "query_embedding": query_embedding,
                    "match_count": k,
                    "filter": meta_filter,
                },
            ).execute()
            rows = res.data or []
            out: list[tuple[Document, float]] = []
            for row in rows:
                doc = Document(
                    page_content=row.get("content", "") or "",
                    metadata=row.get("metadata") or {},
                )
                similarity = row.get("similarity")
                distance = 1.0 - similarity if similarity is not None else 1.0
                out.append((doc, distance))
            return out

        return await asyncio.to_thread(_run)

    async def similarity_search(
        self,
        session_id: str,
        query: str,
        k: int = 6,
        filter: Optional[dict] = None,
    ) -> list[Document]:
        scored = await self.similarity_search_with_scores(session_id, query, k, filter)
        return [doc for doc, _ in scored]

    async def delete_session(self, session_id: str) -> None:
        """Delete all of a session's embeddings."""
        def _del():
            self.client.table(TABLE_NAME) \
                .delete() \
                .filter("metadata->>session_id", "eq", session_id) \
                .execute()

        await asyncio.to_thread(_del)

    async def get_collection_stats(self, session_id: str) -> dict:
        def _count():
            res = self.client.table(TABLE_NAME) \
                .select("id", count="exact") \
                .filter("metadata->>session_id", "eq", session_id) \
                .execute()
            return res.count or 0

        try:
            count = await asyncio.to_thread(_count)
            return {"session_id": session_id, "chunk_count": count}
        except Exception:
            return {"session_id": session_id, "chunk_count": 0}


# Module-level singleton
_manager: Optional[VectorStoreManager] = None


def get_vector_store_manager() -> VectorStoreManager:
    """Get or create the global VectorStoreManager singleton."""
    global _manager
    if _manager is None:
        _manager = VectorStoreManager()
    return _manager
