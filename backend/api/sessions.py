"""
Sessions API — CRUD for diligence sessions.
All sessions are scoped to the authenticated user via Supabase RLS.
"""

from fastapi import APIRouter, HTTPException, Depends, status

from backend.database import get_supabase_client
from backend.api.auth_middleware import get_current_user
from backend.models.session import SessionCreate, SessionResponse, SessionUpdate
from backend.ingestion.vectorstore import get_vector_store_manager

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    req: SessionCreate,
    user: dict = Depends(get_current_user),
):
    """Create a new diligence session."""
    try:
        client = get_supabase_client()
        result = (
            client.table("sessions")
            .insert({
                "user_id": user["user_id"],
                "name": req.name,
                "description": req.description,
            })
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create session.",
            )

        return SessionResponse(**result.data[0])

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session creation failed: {str(e)}",
        )


@router.get("")
async def list_sessions(user: dict = Depends(get_current_user)):
    """List all sessions for the authenticated user."""
    try:
        client = get_supabase_client()
        result = (
            client.table("sessions")
            .select("*")
            .eq("user_id", user["user_id"])
            .order("created_at", desc=True)
            .execute()
        )

        return {"sessions": result.data or []}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list sessions: {str(e)}",
        )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    """Get a single session by ID."""
    try:
        client = get_supabase_client()
        try:
            result = (
                client.table("sessions")
                .select("*")
                .eq("id", session_id)
                .eq("user_id", user["user_id"])
                .single()
                .execute()
            )
        except Exception as e:
            if "PGRST116" in str(e) or "0 rows" in str(e) or "no rows" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Session not found.",
                )
            raise
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found.",
            )

        return SessionResponse(**result.data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch session: {str(e)}",
        )


@router.patch("/{session_id}")
async def update_session(
    session_id: str,
    req: SessionUpdate,
    user: dict = Depends(get_current_user),
):
    """Update a session's name, description, or status."""
    try:
        client = get_supabase_client()
        update_data = req.model_dump(exclude_none=True)

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update.",
            )

        result = (
            client.table("sessions")
            .update(update_data)
            .eq("id", session_id)
            .eq("user_id", user["user_id"])
            .execute()
        )

        return {"message": "Session updated", "data": result.data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session update failed: {str(e)}",
        )


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a session and its associated Chroma collection."""
    try:
        client = get_supabase_client()

        # Delete from Supabase (cascades to documents, reports, chat_messages)
        client.table("sessions") \
            .delete() \
            .eq("id", session_id) \
            .eq("user_id", user["user_id"]) \
            .execute()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Session deletion failed: {str(e)}",
        )

    # Vector-store cleanup is best-effort: the session row is already gone, so a
    # failure here (e.g. Chroma/embedding init issues on a constrained host)
    # must NOT turn a successful delete into a 500 — otherwise the UI keeps
    # showing the deleted card.
    try:
        manager = get_vector_store_manager()
        await manager.delete_session(session_id)
    except Exception as e:
        print(f"[sessions] vector cleanup failed for {session_id}: {e}")

    return {"message": "Session deleted"}
