from fastapi import APIRouter
from backend.app.api.v1.endpoints import system, investigations, retail

api_router = APIRouter()
api_router.include_router(system.router, tags=["system"])
api_router.include_router(investigations.router, tags=["investigations"])
api_router.include_router(retail.router, prefix="/retail", tags=["retail"])
