"""
Analyze API — triggers the LangGraph pipeline and streams results via SSE.
"""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.database import get_supabase_client
from backend.api.auth_middleware import get_current_user
from backend.graph.pipeline import run_pipeline
from backend.utils.streaming import (
    emit_node_start, emit_node_complete, emit_complete, emit_error,
)

router = APIRouter(prefix="/api/sessions", tags=["analyze"])


class AnalyzeRequest(BaseModel):
    mode: str = "full"


@router.post("/{session_id}/analyze")
async def analyze_session(
    session_id: str,
    req: AnalyzeRequest,
    user: dict = Depends(get_current_user),
):
    """Trigger analysis pipeline, stream SSE progress events."""
    client = get_supabase_client()

    session_check = client.table("sessions").select("*") \
        .eq("id", session_id).eq("user_id", user["user_id"]).single().execute()
    if not session_check.data:
        raise HTTPException(status_code=404, detail="Session not found.")

    docs_result = client.table("documents").select("*") \
        .eq("session_id", session_id).eq("status", "ready").execute()
    if not docs_result.data:
        raise HTTPException(status_code=400, detail="No processed documents found.")

    client.table("sessions").update({"status": "analyzing"}).eq("id", session_id).execute()

    async def event_stream():
        try:
            yield await emit_node_start("retrieve", "Retrieving relevant excerpts...")
            result = await run_pipeline(
                session_id=session_id, user_id=user["user_id"],
                analysis_mode=req.mode, documents_metadata=docs_result.data,
            )
            steps = result.get("steps_completed", [])
            for step in steps:
                yield await emit_node_complete(step, f"{step} complete")

            report = result.get("final_report")
            if report:
                client.table("reports").insert({
                    "session_id": session_id, "user_id": user["user_id"],
                    "analysis_mode": req.mode,
                    "risk_assessment": report.get("risk_assessment"),
                    "growth_opportunities": report.get("growth_opportunities"),
                    "legal_analysis": report.get("legal_analysis"),
                    "executive_summary": report.get("executive_summary"),
                    "citations": report.get("citations", []),
                    "report_metadata": report.get("metadata", {}),
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                }).execute()
                client.table("sessions").update({"status": "completed"}).eq("id", session_id).execute()
                yield await emit_complete(report)
            else:
                yield await emit_error("No report generated.")
        except Exception as e:
            client.table("sessions").update({"status": "active"}).eq("id", session_id).execute()
            yield await emit_error(f"Analysis failed: {str(e)}")

    return StreamingResponse(event_stream(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"})

from fastapi.responses import FileResponse
import os
from backend.utils.document_builder import generate_beautiful_report
from backend.config import get_settings

@router.get("/{session_id}/download-report")
async def download_report(session_id: str, user: dict = Depends(get_current_user)):
    """Generates and downloads the DOCX report."""
    client = get_supabase_client()
    
    # Verify session
    session_check = client.table("sessions").select("*").eq("id", session_id).eq("user_id", user["user_id"]).single().execute()
    if not session_check.data:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    # Fetch report
    report_res = client.table("reports").select("*").eq("session_id", session_id).single().execute()
    if not report_res.data:
        raise HTTPException(status_code=404, detail="Report not generated yet.")
        
    report_data = report_res.data
    output_filename = f"Diligence_Report_{session_id[:8]}.docx"
    output_path = os.path.join(get_settings().upload_dir, output_filename)
    
    # Generate DOCX
    generate_beautiful_report(report_data, output_path)
    
    if not os.path.exists(output_path):
        raise HTTPException(status_code=500, detail="Failed to generate document.")
        
    return FileResponse(
        path=output_path,
        filename=output_filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
