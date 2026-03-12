from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[3]
ENV_FILES = (
    str(BASE_DIR / ".env"),
    str(BASE_DIR / "apps" / "api" / ".env"),
)


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PORT: int = 8000

    # DB Settings
    DATABASE_URL: Optional[str] = None
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "tucumind_recibos"
    DB_POOL_SIZE: int = 2
    DB_MAX_OVERFLOW: int = 0
    DB_POOL_RECYCLE: int = 300

    # Auth Settings
    ADMIN_USER: str
    ADMIN_PASSWORD_HASH: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    model_config = SettingsConfigDict(env_file=ENV_FILES, env_file_encoding="utf-8", extra="ignore")

    @property
    def resolved_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


@lru_cache()
def get_settings() -> Settings:
    return Settings()  # type: ignore
