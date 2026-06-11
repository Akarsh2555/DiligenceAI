"""
Auth API — Google OAuth via Supabase Auth + profile management.
Frontend initiates Google OAuth; backend validates the resulting JWT.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import RedirectResponse
from backend.database import get_supabase_anon_client, get_supabase_client
from backend.api.auth_middleware import get_current_user
from backend.models.session import AuthResponse, ProfileResponse
from backend.config import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/google")
async def google_login(request: Request):
    """
    Initiate Google OAuth flow via Supabase.
    Returns the OAuth URL for the frontend to redirect to.
    """
    settings = get_settings()
    client = get_supabase_anon_client()

    # The redirect URL should point to your frontend callback
    redirect_url = str(request.base_url).rstrip("/")
    # In production, use the frontend URL
    callback_url = f"{redirect_url}/api/auth/callback"

    try:
        result = client.auth.sign_in_with_oauth({
            "provider": "google",
            "options": {
                "redirect_to": callback_url,
            },
        })

        return {"url": result.url}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Google OAuth: {str(e)}",
        )


@router.get("/callback")
async def auth_callback(
    access_token: str = None,
    refresh_token: str = None,
):
    """
    OAuth callback — Supabase redirects here after Google auth.
    In practice, Supabase redirects to the frontend with tokens in the URL hash.
    This endpoint is a fallback for server-side token exchange.
    """
    if access_token and refresh_token:
        # Redirect to frontend with tokens
        frontend_url = "http://localhost:5173"
        return RedirectResponse(
            url=f"{frontend_url}/auth/callback#access_token={access_token}&refresh_token={refresh_token}"
        )

    return {"message": "OAuth callback received. Check URL hash for tokens."}


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """Sign out the current user."""
    try:
        client = get_supabase_anon_client()
        client.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}",
        )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(refresh_token: str):
    """Refresh an expired access token."""
    try:
        client = get_supabase_anon_client()
        result = client.auth.refresh_session(refresh_token)

        if not result.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        return AuthResponse(
            access_token=result.session.access_token,
            refresh_token=result.session.refresh_token,
            user_id=str(result.user.id),
            email=result.user.email or "",
            expires_at=result.session.expires_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token refresh failed: {str(e)}",
        )


@router.get("/me", response_model=ProfileResponse)
async def get_profile(user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    try:
        client = get_supabase_client()
        result = (
            client.table("profiles")
            .select("*")
            .eq("id", user["user_id"])
            .single()
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found.",
            )

        return ProfileResponse(**result.data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile: {str(e)}",
        )


@router.put("/me")
async def update_profile(
    full_name: str = None,
    avatar_url: str = None,
    user: dict = Depends(get_current_user),
):
    """Update the current user's profile."""
    try:
        client = get_supabase_client()
        update_data = {}
        if full_name is not None:
            update_data["full_name"] = full_name
        if avatar_url is not None:
            update_data["avatar_url"] = avatar_url

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update.",
            )

        result = (
            client.table("profiles")
            .update(update_data)
            .eq("id", user["user_id"])
            .execute()
        )

        return {"message": "Profile updated", "data": result.data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}",
        )
