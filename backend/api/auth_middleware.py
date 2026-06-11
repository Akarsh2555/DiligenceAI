"""
Authentication middleware — validates Supabase JWT tokens.
Extracts user_id from the token for all protected endpoints.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.database import get_supabase_anon_client

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    FastAPI dependency — validates the Supabase JWT using Supabase Auth.
    Returns dict with user_id and email.
    """
    token = credentials.credentials
    client = get_supabase_anon_client()

    try:
        response = client.auth.get_user(token)
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )

        return {
            "user_id": str(response.user.id),
            "email": response.user.email or "",
            "token": token
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
