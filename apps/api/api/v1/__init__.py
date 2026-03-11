from fastapi import APIRouter
from .endpoints import auth, clients, receipts

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
