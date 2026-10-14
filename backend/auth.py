from fastapi import Header, HTTPException, Depends
from typing import Optional
from database import supabase

async def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Extracts and validates Supabase JWT from Authorization header.
    Returns user dictionary if authenticated, or None if no token provided.
    """
    if not authorization:
        return None

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format. Expected 'Bearer <token>'.")

    token = authorization.split(" ")[1]
    try:
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return {
                "id": str(user_response.user.id),
                "email": user_response.user.email,
                "user_metadata": user_response.user.user_metadata or {}
            }
        raise HTTPException(status_code=401, detail="User session invalid or expired.")
    except Exception as e:
        # If token validation fails with Supabase auth
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def require_auth_user(user: Optional[dict] = Depends(get_current_user)) -> dict:
    """Dependency that strictly enforces authentication."""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required. Please sign in.")
    return user
