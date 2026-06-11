"""
Upload API — multipart file upload with async ingestion pipeline.
Validates file types and sizes, runs ingestion in background tasks.
"""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status, BackgroundTasks

from backend.config import get_settings
from backend.database import get_supabase_client
from backend.api.auth_middleware import get_current_user
from backend.ingestion.loader import DocumentLoaderRouter, SUPPORTED_EXTENSIONS
from backend.ingestion.chunker import SmartChunker
from backend.ingestion.vectorstore import get_vector_store_manager

router = APIRouter(prefix="/api/sessions", tags=["upload"])


async def _run_ingestion(
    file_path: str,
    doc_id: str,
    session_id: str,
    user_id: str,
):
    """
    Background task: run the LangGraph ingestion pipeline.
    """
    import asyncio
    from backend.graph.ingestion_graph import build_ingestion_graph

    graph = build_ingestion_graph()
    initial_state = {
        "file_path": file_path,
        "doc_id": doc_id,
        "session_id": session_id,
        "user_id": user_id,
        "chunk_index": 0,
        "error": ""
    }

    try:
        # Hard ceiling so a hung embedding/API call can't leave the document
        # stuck on "processing" forever — it gets recorded as an error instead.
        await asyncio.wait_for(graph.ainvoke(initial_state), timeout=600)
    except Exception as e:
        msg = "Ingestion timed out" if isinstance(e, asyncio.TimeoutError) else str(e)
        client = get_supabase_client()
        client.table("documents") \
            .update({"status": "error", "error_message": msg[:500]}) \
            .eq("id", doc_id) \
            .execute()


@router.post("/{session_id}/upload")
async def upload_documents(
    session_id: str,
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    user: dict = Depends(get_current_user),
):
    """
    Upload one or more documents to a session.
    Runs ingestion asynchronously via BackgroundTasks.
    """
    settings = get_settings()
    client = get_supabase_client()

    # Verify session exists and belongs to user
    session_check = (
        client.table("sessions")
        .select("id")
        .eq("id", session_id)
        .eq("user_id", user["user_id"])
        .execute()
    )

    if not session_check.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    results = []

    for file in files:
        # Validate file extension
        ext = Path(file.filename).suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            results.append({
                "filename": file.filename,
                "status": "rejected",
                "error": f"Unsupported file type: {ext}. Supported: {', '.join(SUPPORTED_EXTENSIONS)}",
            })
            continue

        # Read file content and check size
        content = await file.read()
        if len(content) > settings.max_file_size_bytes:
            results.append({
                "filename": file.filename,
                "status": "rejected",
                "error": f"File too large ({len(content) / 1024 / 1024:.1f}MB). Max: {settings.max_file_size_mb}MB",
            })
            continue

        # Sanitize filename and save to disk
        safe_name = f"{uuid.uuid4().hex}_{file.filename.replace('..', '').replace('/', '_')}"
        file_path = settings.upload_path / session_id
        file_path.mkdir(parents=True, exist_ok=True)
        full_path = file_path / safe_name

        with open(full_path, "wb") as f:
            f.write(content)

        # Create document record in Supabase
        doc_result = (
            client.table("documents")
            .insert({
                "session_id": session_id,
                "user_id": user["user_id"],
                "filename": file.filename,
                "file_path": str(full_path),
                "file_type": ext.lstrip("."),
                "file_size": len(content),
                "status": "pending",
            })
            .execute()
        )

        doc_id = doc_result.data[0]["id"]

        # Queue background ingestion
        background_tasks.add_task(
            _run_ingestion,
            str(full_path),
            doc_id,
            session_id,
            user["user_id"],
        )

        results.append({
            "filename": file.filename,
            "document_id": doc_id,
            "status": "queued",
            "file_size": len(content),
        })

    return {
        "files_received": len(results),
        "results": results,
    }
