"""Application settings loaded from the package-local .env file."""

from pathlib import Path
from typing import Literal

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_CORS_ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"


class Settings(BaseSettings):
    """Configuration shared by the API modules."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent / ".env",
        env_file_encoding="utf-8",
    )

    jwt_secret_key: SecretStr | None = None
    model_device: Literal["cpu", "cuda"] = "cpu"
    database_url: str = "sqlite+aiosqlite:///./cattle-net.db"
    cors_allowed_origins: str = DEFAULT_CORS_ALLOWED_ORIGINS
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    max_upload_size_bytes: int = 5 * 1024 * 1024

    @field_validator("cors_allowed_origins")
    @classmethod
    def validate_cors_allowed_origins(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]

        if not origins:
            raise ValueError("CORS_ALLOWED_ORIGINS must contain at least one origin")
        if "*" in origins:
            raise ValueError("CORS_ALLOWED_ORIGINS cannot contain '*' with credentials")

        return ",".join(origins)

    @property
    def cors_origins(self) -> list[str]:
        """Return the configured comma-separated origins as a list."""
        return self.cors_allowed_origins.split(",")


settings = Settings()
