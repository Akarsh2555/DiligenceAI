"""
VectorStoreManager — ChromaDB wrapper with per-session collection isolation.
Abstracts vector operations behind a clean interface for easy Pinecone swap.
"""

import asyncio
from typing import Optional

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings

from backend.config import get_settings
from backend.ingestion.embedder import get_embedding_model


class VectorStoreManager:
    """
    Manages ChromaDB collections namespaced by session_id.
    Each diligence session gets its own isolated collection.
    """

    def __init__(self, embedding_model: Optional[Embeddings] = None):
        self.settings = get_settings()
        self.embedding_model = embedding_model or get_embedding_model()
        self._stores: dict[str, Chroma] = {}

    def _get_collection_name(self, session_id: str) -> str:
        """Generate a deterministic collection name for a session."""
        # Chroma collection names must be 3-63 chars, alphanumeric + underscores
        clean_id = session_id.replace("-", "_")
        return f"session_{clean_id}"[:63]

    def _get_store(self, session_id: str) -> Chroma:
        """Get or create a Chroma store for the given session."""
        if session_id not in self._stores:
            self._stores[session_id] = Chroma(
                collection_name=self._get_collection_name(session_id),
                embedding_function=self.embedding_model,
                persist_directory=str(self.settings.chroma_path),
            )
        return self._stores[session_id]

    async def add_documents(
        self,
        session_id: str,
        documents: list[Document],
        batch_size: int = 100,
    ) -> list[str]:
        """
        Add documents to the session's collection in batches.
        Returns list of generated IDs.
        """
        from langchain_community.vectorstores.utils import filter_complex_metadata
        
        documents = filter_complex_metadata(documents)
        store = self._get_store(session_id)
        all_ids = []

        for i in range(0, len(documents), batch_size):
            batch = documents[i : i + batch_size]
            ids = await asyncio.to_thread(store.add_documents, documents=batch)
            all_ids.extend(ids)

        return all_ids

    async def similarity_search(
        self,
        session_id: str,
        query: str,
        k: int = 6,
        filter: Optional[dict] = None,
    ) -> list[Document]:
        """
        Search for similar documents within a session's collection.
        Supports metadata filtering by doc_type, source_file, page_number.
        """
        store = self._get_store(session_id)

        results = await asyncio.to_thread(
            store.similarity_search,
            query=query,
            k=k,
            filter=filter,
        )
        return results

    async def similarity_search_with_scores(
        self,
        session_id: str,
        query: str,
        k: int = 6,
        filter: Optional[dict] = None,
    ) -> list[tuple[Document, float]]:
        """Search with relevance scores for reranking."""
        store = self._get_store(session_id)

        results = await asyncio.to_thread(
            store.similarity_search_with_score,
            query=query,
            k=k,
            filter=filter,
        )
        return results

    async def delete_session(self, session_id: str) -> None:
        """Delete an entire session's collection from ChromaDB."""
        store = self._get_store(session_id)
        collection_name = self._get_collection_name(session_id)

        try:
            await asyncio.to_thread(
                store._client.delete_collection,
                name=collection_name,
            )
        except Exception:
            pass  # Collection may not exist

        # Remove from cache
        self._stores.pop(session_id, None)

    async def get_collection_stats(self, session_id: str) -> dict:
        """Get stats about a session's collection."""
        store = self._get_store(session_id)
        try:
            collection = await asyncio.to_thread(
                lambda: store._collection
            )
            count = await asyncio.to_thread(collection.count)
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
