from datetime import timedelta
import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import get_user_from_query_token
from app.core.security import create_token, decode_token, encrypt_secret
from app.db.models.user import User
from app.db.session import get_db

settings = get_settings()
router = APIRouter(prefix="/google", tags=["google"])
SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
]


def _flow(state: str | None = None) -> Flow:
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth credentials are not configured",
        )
    if settings.GOOGLE_REDIRECT_URI.startswith("http://localhost"):
        os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        state=state,
    )
    flow.redirect_uri = settings.GOOGLE_REDIRECT_URI
    return flow


@router.get("/login")
async def google_login(current_user: Annotated[User, Depends(get_user_from_query_token)]):
    state = create_token(
        subject=str(current_user.id),
        expires_delta=timedelta(minutes=settings.OAUTH_STATE_EXPIRE_MINUTES),
        token_type="oauth_state",
    )
    authorization_url, _ = _flow(state).authorization_url(
        access_type="offline",
        include_granted_scopes="false",
        prompt="consent",
    )
    return RedirectResponse(authorization_url)


@router.get("/callback")
async def google_callback(
    code: str,
    state: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    payload = decode_token(state, "oauth_state")
    user = await db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OAuth user not found")

    flow = _flow(state)
    flow.fetch_token(code=code)
    credentials = flow.credentials
    if not credentials.refresh_token and not user.google_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google did not return a refresh token. Try connecting again.",
        )

    if credentials.refresh_token:
        user.google_refresh_token = encrypt_secret(credentials.refresh_token)

    google_email = None
    if credentials.id_token:
        claims = jwt.get_unverified_claims(credentials.id_token)
        google_email = claims.get("email")
    user.google_account_email = google_email or user.google_account_email or "connected"
    await db.flush()
    return RedirectResponse(f"{settings.FRONTEND_URL.rstrip('/')}/")
