"""API v1 master router."""
from fastapi import APIRouter
from backend.app.api.v1.endpoints import system

api_router = APIRouter()
api_router.include_router(system.router, tags=["system"])
