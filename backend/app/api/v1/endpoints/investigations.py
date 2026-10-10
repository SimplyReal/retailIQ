"""Investigation API Endpoints."""

from fastapi import APIRouter, Depends
from backend.app.common.schemas import InvestigationRequest, InvestigationResponse
from backend.app.services.investigation_service import (
    InvestigationService,
    default_investigation_service,
)

router = APIRouter()


def get_investigation_service() -> InvestigationService:
    return default_investigation_service


@router.post(
    "/investigations",
    response_model=InvestigationResponse,
    summary="Execute a deterministic retail investigation",
    description=(
        "Analyzes natural language queries and entity context against local datasets. "
        "Returns evidence-backed agent findings and prioritized recommendations."
    ),
)
async def run_investigation(
    request: InvestigationRequest,
    service: InvestigationService = Depends(get_investigation_service),
) -> InvestigationResponse:
    """Execute investigation across customer and retail scenarios."""
    return service.investigate(request)
