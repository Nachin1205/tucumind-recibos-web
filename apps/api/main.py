from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import get_settings
from api.v1 import api_router

settings = get_settings()

app = FastAPI(
    title="Recibos Digitales API",
    version="1.0.0",
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}
