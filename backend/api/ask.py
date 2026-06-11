"""
Ask API — freeform Q&A with streaming responses and chat history.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.database import get_supabase_client
from backend.api.auth_middleware import get_current_user
from backend.chains.retrieval import retrieve_relevant_chunks
from backend.chains.qa_chain import get_qa_chain, load_chat_history, save_chat_message
from backend.utils.citations import format_chunks_for_prompt, extract_citations_from_chunks
from backend.utils.streaming import emit_token, emit_citations, emit_complete, emit_error

router = APIRouter(prefix="/api/sessions", tags=["ask"])


class AskRequest(BaseModel):
    question: str


def _build_report_context(client, session_id: str, user_id: str, max_chars: int = 6000) -> str:
    """Fetch the latest analysis report for the session and format it as grounding
    context so the chat can answer questions about the report itself, not just
    the raw documents."""
    try:
        res = client.table("reports").select("*") \
            .eq("session_id", session_id).eq("user_id", user_id) \
            .order("created_at", desc=True).limit(1).execute()
    except Exception:
        return ""
    if not res.data:
        return ""

    report = res.data[0]
    sections = [
        ("Executive Summary", report.get("executive_summary")),
        ("Risk Assessment", report.get("risk_assessment")),
        ("Growth Opportunities", report.get("growth_opportunities")),
        ("Legal Analysis", report.get("legal_analysis")),
    ]
    parts = []
    for title, body in sections:
        if body and body.strip():
            parts.append(f"## {title}\n{body.strip()}")
    text = "\n\n".join(parts)
    return text[:max_chars] if text else ""


@router.post("/{session_id}/ask")
async def ask_question(
    session_id: str,
    req: AskRequest,
    user: dict = Depends(get_current_user),
):
    """Stream an answer to a freeform question with citations."""
    client = get_supabase_client()

    session_check = client.table("sessions").select("id") \
        .eq("id", session_id).eq("user_id", user["user_id"]).execute()
    if not session_check.data:
        raise HTTPException(status_code=404, detail="Session not found.")

    async def stream():
        try:
            chunks = await retrieve_relevant_chunks(session_id, req.question, k=8)
            citations = extract_citations_from_chunks(chunks)
            context = format_chunks_for_prompt(chunks)
            chat_history = await load_chat_history(session_id, user["user_id"])
            report_context = _build_report_context(client, session_id, user["user_id"]) \
                or "No analysis report has been generated yet — answer from the document excerpts."

            chain = get_qa_chain(streaming=True)
            full_response = ""

            async for event in chain.astream({
                "context": context,
                "report_context": report_context,
                "chat_history": chat_history,
                "question": req.question,
            }):
                token = event.content if hasattr(event, "content") else str(event)
                if token:
                    full_response += token
                    yield await emit_token(token)

            yield await emit_citations(citations)
            yield await emit_complete({"answer": full_response, "citations": citations})

            # Persist to chat history
            await save_chat_message(session_id, user["user_id"], "user", req.question)
            await save_chat_message(session_id, user["user_id"], "assistant", full_response, citations)

        except Exception as e:
            yield await emit_error(f"Q&A failed: {str(e)}")

    return StreamingResponse(stream(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"})


@router.get("/{session_id}/chat-history")
async def get_chat_history(
    session_id: str,
    user: dict = Depends(get_current_user),
    limit: int = 50,
):
    """Get chat history for a session."""
    client = get_supabase_client()
    result = client.table("chat_messages").select("*") \
        .eq("session_id", session_id).eq("user_id", user["user_id"]) \
        .order("created_at").limit(limit).execute()
    return {"messages": result.data or []}
