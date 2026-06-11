import asyncio
import time
from pathlib import Path
from typing import Annotated, TypedDict, List
from langchain_core.documents import Document
from langgraph.graph import StateGraph, END, START

from backend.database import get_supabase_client
from backend.ingestion.loader import DocumentLoaderRouter
from backend.ingestion.chunker import SmartChunker
from backend.ingestion.vectorstore import get_vector_store_manager

class IngestionState(TypedDict):
    file_path: str
    doc_id: str
    session_id: str
    user_id: str
    raw_docs: List[Document]
    chunks: List[Document]
    chunk_index: int
    doc_type: str
    page_count: int
    error: str

async def load_node(state: IngestionState) -> IngestionState:
    client = get_supabase_client()
    try:
        # Update status to processing
        client.table("documents").update({"status": "processing"}).eq("id", state["doc_id"]).execute()
        
        path = Path(state["file_path"])
        raw_docs = await DocumentLoaderRouter.load(path, state["session_id"])
        
        if not raw_docs:
            return {"error": "No content extracted from file"}
            
        doc_type = raw_docs[0].metadata.get("doc_type", "unknown")
        page_count = len(raw_docs)
        
        return {"raw_docs": raw_docs, "doc_type": doc_type, "page_count": page_count}
    except Exception as e:
        return {"error": str(e)}

def chunk_node(state: IngestionState) -> IngestionState:
    if state.get("error"):
        return state
        
    try:
        chunks = SmartChunker.chunk_documents(state["raw_docs"])
        return {"chunks": chunks, "chunk_index": 0}
    except Exception as e:
        return {"error": str(e)}

async def embed_node(state: IngestionState) -> IngestionState:
    if state.get("error"):
        return state
        
    manager = get_vector_store_manager()
    chunks = state["chunks"]
    chunk_index = state.get("chunk_index", 0)

    # Small batches keep peak memory low (important on 512MB hosts) and stay
    # within embedding-API rate limits.
    batch_size = 16
    batch = chunks[chunk_index:chunk_index + batch_size]
    
    try:
        if batch:
            await manager.add_documents(state["session_id"], batch, batch_size=batch_size)
        return {"chunk_index": chunk_index + len(batch)}
    except Exception as e:
        return {"error": str(e)}

def should_continue_embedding(state: IngestionState) -> str:
    if state.get("error"):
        return "finalize_node"
        
    if state["chunk_index"] < len(state["chunks"]):
        return "embed_node"
    return "finalize_node"

async def finalize_node(state: IngestionState) -> IngestionState:
    client = get_supabase_client()
    doc_id = state["doc_id"]
    session_id = state["session_id"]
    
    if state.get("error"):
        client.table("documents").update({
            "status": "error", 
            "error_message": state["error"][:500]
        }).eq("id", doc_id).execute()
        return state
        
    try:
        # Update document record
        client.table("documents").update({
            "status": "ready",
            "doc_type": state["doc_type"],
            "page_count": state["page_count"],
            "chunk_count": len(state["chunks"]),
        }).eq("id", doc_id).execute()

        # Update session totals
        session_result = client.table("documents").select("id").eq("session_id", session_id).eq("status", "ready").execute()
        total_docs = len(session_result.data) if session_result.data else 0

        chunks_result = client.table("documents").select("chunk_count").eq("session_id", session_id).eq("status", "ready").execute()
        total_chunks = sum(d.get("chunk_count", 0) for d in (chunks_result.data or []))

        client.table("sessions").update({
            "document_count": total_docs,
            "total_chunks": total_chunks,
        }).eq("id", session_id).execute()
        
    except Exception as e:
        client.table("documents").update({"status": "error", "error_message": str(e)[:500]}).eq("id", doc_id).execute()

    return state

def build_ingestion_graph() -> StateGraph:
    workflow = StateGraph(IngestionState)
    
    workflow.add_node("load_node", load_node)
    workflow.add_node("chunk_node", chunk_node)
    workflow.add_node("embed_node", embed_node)
    workflow.add_node("finalize_node", finalize_node)
    
    workflow.add_edge(START, "load_node")
    workflow.add_edge("load_node", "chunk_node")
    workflow.add_edge("chunk_node", "embed_node")
    workflow.add_conditional_edges("embed_node", should_continue_embedding)
    workflow.add_edge("finalize_node", END)
    
    return workflow.compile()
