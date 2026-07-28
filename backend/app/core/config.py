from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://hdms_user:hdms_pass@postgres:5432/hdms_db"

    # JWT
    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    OAUTH_STATE_EXPIRE_MINUTES: int = 10

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/google/callback"

    # Encryption
    FERNET_KEY: str = ""

    # App URLs
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    CORS_ORIGINS: str = "http://localhost:5173"

    # Uploads
    MAX_UPLOAD_SIZE_MB: int = 25

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [self.FRONTEND_URL, *self.CORS_ORIGINS.split(",")]
        return sorted({origin.strip().rstrip("/") for origin in origins if origin.strip()})

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
