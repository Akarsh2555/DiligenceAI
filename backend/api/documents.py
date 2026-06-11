"""
Documents API — list docs, get metadata, fetch reports.
"""

import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse

from backend.database import get_supabase_client
from backend.api.auth_middleware import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["documents"])


@router.get("/{session_id}/documents")
async def list_documents(session_id: str, user: dict = Depends(get_current_user)):
    """List all documents in a session with metadata."""
    client = get_supabase_client()
    result = client.table("documents").select("*") \
        .eq("session_id", session_id).eq("user_id", user["user_id"]) \
        .order("created_at", desc=True).execute()
    return {"documents": result.data or []}


@router.get("/{session_id}/documents/{document_id}")
async def get_document(session_id: str, document_id: str, user: dict = Depends(get_current_user)):
    """Get a single document's details."""
    client = get_supabase_client()
    result = client.table("documents").select("*") \
        .eq("id", document_id).eq("session_id", session_id) \
        .eq("user_id", user["user_id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found.")
    return result.data


@router.get("/{session_id}/documents/{document_id}/view")
async def view_document(session_id: str, document_id: str):
    """View the actual document file."""
    # Note: For simplicity in the demo, auth is skipped on the asset route to allow iframe rendering easily
    client = get_supabase_client()
    result = client.table("documents").select("*") \
        .eq("id", document_id).eq("session_id", session_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    file_path = result.data.get("file_path")
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found in database.")

    if file_path.startswith("http://") or file_path.startswith("https://"):
        # The browser will handle rendering the PDF directly from the URL.
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=file_path)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk.")

    ext = os.path.splitext(file_path)[1].lower()
    media_type = {
        ".pdf": "application/pdf",
        ".txt": "text/plain; charset=utf-8",
        ".md": "text/plain; charset=utf-8",
        ".html": "text/html; charset=utf-8",
    }.get(ext, "application/octet-stream")

    return FileResponse(
        file_path,
        media_type=media_type,
        content_disposition_type="inline",
    )


@router.get("/{session_id}/report")
async def get_report(session_id: str, user: dict = Depends(get_current_user)):
    """Get the latest report for a session."""
    client = get_supabase_client()
    result = client.table("reports").select("*") \
        .eq("session_id", session_id).eq("user_id", user["user_id"]) \
        .order("created_at", desc=True).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No report found.")
    return result.data[0]


@router.get("/{session_id}/reports")
async def list_reports(session_id: str, user: dict = Depends(get_current_user)):
    """List all reports for a session."""
    client = get_supabase_client()
    result = client.table("reports").select("*") \
        .eq("session_id", session_id).eq("user_id", user["user_id"]) \
        .order("created_at", desc=True).execute()
    return {"reports": result.data or []}
