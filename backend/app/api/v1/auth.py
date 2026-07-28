from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.core.security import decode_token
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserRead
from app.services.auth_service import (
    authenticate_user,
    issue_access_token,
    issue_refresh_token,
    register_user,
)

settings = get_settings()
router = APIRouter(tags=["auth"])
limiter = Limiter(key_func=get_remote_address)
REFRESH_COOKIE = "hdms_refresh_token"


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        max_age=int(timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS).total_seconds()),
        httponly=True,
        secure=settings.BACKEND_URL.startswith("https://"),
        samesite="lax",
        path="/api/v1",
    )


@router.post("/register", response_model=TokenResponse)
@limiter.limit("8/minute")
async def register(
    request: Request,
    payload: RegisterRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    del request
    user = await register_user(db, payload.email, payload.password)
    refresh_token = issue_refresh_token(user)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=issue_access_token(user))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    del request
    user = await authenticate_user(db, payload.email, payload.password)
    refresh_token = issue_refresh_token(user)
    _set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=issue_access_token(user))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: Request, db: Annotated[AsyncSession, Depends(get_db)]) -> TokenResponse:
    token = request.cookies.get(REFRESH_COOKIE, "")
    payload = decode_token(token, "refresh")
    user = await db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token user no longer exists")
    return TokenResponse(access_token=issue_access_token(user))


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1")
    return {"status": "ok"}


@router.get("/me", response_model=UserRead)
async def me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user
