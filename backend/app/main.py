"""RetailIQ Backend API Entrypoint."""
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1.router import api_router
from backend.app.core.config import settings

app = FastAPI(
    title="RetailIQ API",
    description="Backend intelligence and investigation layer for RetailIQ.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root liveness probe
@app.get("/health", summary="Health liveness probe", tags=["health"])
async def health_check():
    """Returns basic liveness and readiness status."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

# Mount versioned API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
