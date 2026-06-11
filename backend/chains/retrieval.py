"""
Retrieval chain — performs similarity search with optional reranking.
Central retrieval logic used by all analysis nodes.
"""

from langchain_core.documents import Document

from backend.ingestion.vectorstore import get_vector_store_manager


async def retrieve_relevant_chunks(
    session_id: str,
    query: str,
    k: int = 6,
    filter: dict | None = None,
) -> list[Document]:
    """
    Retrieve the most relevant chunks from a session's vector store.
    Returns documents sorted by relevance score (highest first).
    """
    manager = get_vector_store_manager()

    results = await manager.similarity_search_with_scores(
        session_id=session_id,
        query=query,
        k=k,
        filter=filter,
    )

    # Sort by score (lower is better in Chroma's L2 distance)
    results.sort(key=lambda x: x[1])

    # Attach score to document metadata
    docs = []
    for doc, score in results:
        doc.metadata["relevance_score"] = round(1.0 / (1.0 + score), 4)
        docs.append(doc)

    return docs


async def retrieve_multi_query(
    session_id: str,
    queries: list[str],
    k: int = 6,
    filter: dict | None = None,
) -> list[Document]:
    """
    Run multiple retrieval queries in parallel and deduplicate results.
    Used by the retrieve_node for comprehensive document coverage.
    """
    import asyncio

    tasks = [
        retrieve_relevant_chunks(session_id, query, k=k, filter=filter)
        for query in queries
    ]

    all_results = await asyncio.gather(*tasks)

    # Deduplicate by content hash
    seen = set()
    deduped = []

    for results in all_results:
        for doc in results:
            content_key = hash(doc.page_content[:100])
            if content_key not in seen:
                seen.add(content_key)
                deduped.append(doc)

    # Sort by relevance score descending
    deduped.sort(
        key=lambda d: d.metadata.get("relevance_score", 0),
        reverse=True,
    )

    return deduped
