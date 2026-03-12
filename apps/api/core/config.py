from pathlib import Path
from functools import lru_cache
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
    APP_DOMAIN: str = "recibos.tucumind.com"
    CORS_ORIGINS: str = "https://recibos.tucumind.com,http://localhost:5173,http://127.0.0.1:5173"
    ALLOWED_HOSTS: str = "recibos.tucumind.com,localhost,127.0.0.1"

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

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_hosts_list(self) -> list[str]:
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",") if host.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


@lru_cache()
def get_settings() -> Settings:
    return Settings()  # type: ignore
