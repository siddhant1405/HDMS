from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from slowapi import _rate_limit_exceeded_handler

from app.api.v1.auth import limiter as auth_limiter
from app.api.v1.auth import router as auth_router
from app.api.v1.google_oauth import router as google_router
from app.api.v1.patients import router as patients_router
from app.api.v1.uploads import router as uploads_router
from app.core.config import get_settings
from app.db import models
from app.db.base import Base
from app.db.session import engine

settings = get_settings()
limiter = auth_limiter or Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Hospital Patient Documentation System",
    description="Mobile-first PWA for hospital document management with Google Drive integration",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "service": "hospital-docs-api"}


app.include_router(auth_router, prefix="/api/v1")
app.include_router(google_router, prefix="/api/v1")
app.include_router(patients_router, prefix="/api/v1")
app.include_router(uploads_router, prefix="/api/v1")
