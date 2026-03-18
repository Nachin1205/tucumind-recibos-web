from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import get_settings
from api.v1 import api_router

settings = get_settings()
BASE_DIR = Path(__file__).resolve().parents[2]
WEB_PUBLIC_DIR = BASE_DIR / "apps" / "web" / "public"

app = FastAPI(
    title="Recibos Digitales API",
    version="1.0.0",
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.allowed_hosts_list,
)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1024,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

if WEB_PUBLIC_DIR.exists():
    app.mount("/public", StaticFiles(directory=str(WEB_PUBLIC_DIR)), name="web_public")

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}
