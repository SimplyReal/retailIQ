"""Retail Intelligence API Endpoints.

Provides dataset-calculated KPIs, prioritized anomaly signals, sales period comparisons,
multi-store inventory balance, return metrics, and consolidated decision queues.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Query
from backend.app.services.retail_analytics_service import default_retail_analytics

router = APIRouter()


@router.get("/overview", summary="Get aggregated retail intelligence command center overview")
async def get_retail_overview() -> Dict[str, Any]:
    """Retrieve complete retail overview with KPIs, signals, analytics, and decisions."""
    return default_retail_analytics.get_overview()


@router.get("/kpis", summary="Get top-level business KPIs")
async def get_retail_kpis() -> Dict[str, Any]:
    """Retrieve top-level sales, inventory, return, and promotion KPIs."""
    return default_retail_analytics.get_kpis()


@router.get("/signals", summary="Get prioritized anomaly signals")
async def get_retail_signals() -> Dict[str, Any]:
    """Retrieve prioritized business signals linked to dataset evidence."""
    return {"signals": default_retail_analytics.get_prioritized_signals()}


@router.get("/sales-investigation", summary="Get sales period comparison for post-promo decline")
async def get_sales_investigation(
    product_id: str = Query("PROD-0005", description="Product ID to analyze")
) -> Dict[str, Any]:
    """Retrieve detailed period 1 vs period 2 comparison for post-promotion analysis."""
    return default_retail_analytics.get_sales_analytics(product_id)


@router.get("/inventory-intelligence", summary="Get store-level inventory balance and transfer recommendations")
async def get_inventory_intelligence(
    product_id: str = Query("PROD-0001", description="Product ID to analyze")
) -> Dict[str, Any]:
    """Retrieve multi-store stock distribution and grounded transfer recommendations."""
    return default_retail_analytics.get_inventory_analytics(product_id)


@router.get("/return-intelligence", summary="Get return rates, ratings, and sizing complaint analytics")
async def get_return_intelligence() -> Dict[str, Any]:
    """Retrieve return analytics with explicit denominators and sizing defect breakdown."""
    return default_retail_analytics.get_return_analytics()


@router.get("/decision-queue", summary="Get consolidated next-best-actions decision queue")
async def get_decision_queue() -> Dict[str, Any]:
    """Retrieve prioritized decision queue consolidated across intelligence agents."""
    return {"decisions": default_retail_analytics.get_decision_queue()}
