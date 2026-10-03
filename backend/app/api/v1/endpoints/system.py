"""System endpoints for RetailIQ."""
from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.core.config import settings

router = APIRouter()


@router.get("/system", summary="System information and readiness status")
async def get_system_status():
    """Return backend system metadata, version, and initialized module status."""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "ready",
        "modules": {
            "customer_intelligence": "initialized",
            "retail_intelligence": "initialized",
            "orchestrator": "initialized",
            "evidence_layer": "initialized",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
