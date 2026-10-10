"""Tests for RetailIQ Retail Intelligence Analytics and API Endpoints.

Verifies dataset-grounded metric calculations, explicit denominators, period comparisons,
multi-store inventory imbalances, return defect rates, and API responses.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.retail_analytics_service import default_retail_analytics


@pytest.fixture
def client():
    return TestClient(app)


def test_retail_kpis_calculation():
    """Verify top-level business KPIs are computed accurately from CSV datasets."""
    kpis = default_retail_analytics.get_kpis()

    # Sales checks
    sales = kpis["sales"]
    assert sales["order_count"] == 30
    assert sales["total_revenue"] == 72011.48
    assert sales["average_order_value"] == 2400.38
    assert sales["currency"] == "INR"

    # Inventory checks
    inventory = kpis["inventory"]
    assert inventory["total_network_units"] == 2029
    assert inventory["total_sku_store_combinations"] == 75
    assert inventory["out_of_stock_count"] == 2  # PROD-0002 in STORE-001 and STORE-002

    # Returns checks with explicit denominator
    returns = kpis["returns"]
    assert returns["total_reviews"] == 16
    assert returns["total_returns"] == 8
    assert returns["overall_return_rate_pct"] == 50.0
    assert "8 returns out of 16" in returns["denominator_explanation"]


def test_retail_signals_grounding():
    """Verify anomaly signals link to actual datasets and carry valid metadata."""
    signals = default_retail_analytics.get_prioritized_signals()
    assert len(signals) >= 4

    # Critical sizing return signal on PROD-0006
    s_ret = next((s for s in signals if s["product_id"] == "PROD-0006"), None)
    assert s_ret is not None
    assert s_ret["severity"] == "CRITICAL"
    assert s_ret["metric_value"] == "80.0%"
    assert "8 returns / 10" in s_ret["denominator"]
    assert "jacket" in s_ret["investigation_query"].lower()

    # Sales drop signal on PROD-0005
    s_sal = next((s for s in signals if s["product_id"] == "PROD-0005"), None)
    assert s_sal is not None
    assert s_sal["severity"] == "HIGH"
    assert "-77.8%" in s_sal["metric_value"]

    # Inventory imbalance signal on PROD-0001
    s_inv = next((s for s in signals if s["product_id"] == "PROD-0001"), None)
    assert s_inv is not None
    assert s_inv["severity"] == "HIGH"
    assert "42.5x" in s_inv["metric_value"]


def test_sales_investigation_period_comparison():
    """Verify post-promotion sales comparison between Period 1 (active) and Period 2 (expired)."""
    sales = default_retail_analytics.get_sales_analytics("PROD-0005")

    p1 = sales["period_1_promo"]
    p2 = sales["period_2_post_promo"]
    changes = sales["calculated_changes"]

    assert p1["orders_count"] == 9
    assert p1["net_revenue"] == 9891.0
    assert p2["orders_count"] == 2
    assert p2["net_revenue"] == 2998.0

    # Volume drop: ((9 - 2) / 9) * 100 = 77.77% -> 77.8%
    assert changes["order_volume_drop_pct"] == 77.8
    assert changes["volume_delta_orders"] == -7

    rec = sales["investigation_recommendation"]
    assert rec["priority"] == "HIGH"
    assert "continuation" in rec["action"].lower()


def test_inventory_analytics_multi_store():
    """Verify multi-store stock level breakdown and transfer recommendation grounding."""
    inv = default_retail_analytics.get_inventory_analytics("PROD-0001")

    assert inv["product_id"] == "PROD-0001"
    assert inv["total_network_stock"] == 169  # 2 + 30 + 22 + 85 + 30

    deficit = inv["deficit_store"]
    surplus = inv["surplus_store"]

    assert deficit["store_id"] == "STORE-001"
    assert deficit["stock"] == 2
    assert surplus["store_id"] == "STORE-004"
    assert surplus["stock"] == 85

    assert inv["imbalance_ratio"] == 42.5
    assert inv["recommended_transfer_units"] == 41

    transfer_rec = inv["transfer_recommendation"]
    assert "STORE-004" in transfer_rec["action"]
    assert "STORE-001" in transfer_rec["action"]


def test_return_analytics_explicit_denominators():
    """Verify product-level return rates, average ratings, and sizing issue breakdown."""
    rets = default_retail_analytics.get_return_analytics()

    assert rets["catalog_total_reviews"] == 16
    assert rets["catalog_total_returns"] == 8

    flagged = rets["flagged_product"]
    assert flagged is not None
    assert flagged["product_id"] == "PROD-0006"
    assert flagged["total_reviews_denominator"] == 10
    assert flagged["returns_count_numerator"] == 8
    assert flagged["return_rate_pct"] == 80.0
    assert flagged["sizing_issues_count"] == 8
    assert flagged["sizing_share_of_returns_pct"] == 100.0
    assert len(flagged["customer_quotes"]) > 0


def test_decision_queue_structure():
    """Verify consolidated decision queue has actionable, evidence-backed items."""
    queue = default_retail_analytics.get_decision_queue()
    assert len(queue) == 4

    agents = {q["agent"] for q in queue}
    assert "Supply-Demand Intelligence Agent" in agents
    assert "Return Intelligence Agent" in agents
    assert "Sales Investigation Agent" in agents
    assert "Lost Sale Investigation Agent" in agents

    for item in queue:
        assert item["priority"] in ("HIGH", "MEDIUM", "LOW")
        assert 0.0 <= item["confidence"] <= 1.0
        assert item["target_product_id"]
        assert item["action"]
        assert item["investigation_query"]


def test_api_retail_endpoints(client):
    """Verify all /api/v1/retail/* endpoints respond with 200 and typed payloads."""
    # Overview
    r_ov = client.get("/api/v1/retail/overview")
    assert r_ov.status_code == 200
    ov_data = r_ov.json()
    assert ov_data["status"] == "success"
    assert "kpis" in ov_data
    assert "signals" in ov_data
    assert "sales_analytics" in ov_data
    assert "inventory_analytics" in ov_data
    assert "return_analytics" in ov_data
    assert "decision_queue" in ov_data

    # KPIs
    r_kpi = client.get("/api/v1/retail/kpis")
    assert r_kpi.status_code == 200
    assert r_kpi.json()["sales"]["order_count"] == 30

    # Signals
    r_sig = client.get("/api/v1/retail/signals")
    assert r_sig.status_code == 200
    assert len(r_sig.json()["signals"]) >= 4

    # Sales
    r_sal = client.get("/api/v1/retail/sales-investigation?product_id=PROD-0005")
    assert r_sal.status_code == 200
    assert r_sal.json()["product_id"] == "PROD-0005"

    # Inventory
    r_inv = client.get("/api/v1/retail/inventory-intelligence?product_id=PROD-0001")
    assert r_inv.status_code == 200
    assert r_inv.json()["deficit_store"]["store_id"] == "STORE-001"

    # Returns
    r_ret = client.get("/api/v1/retail/return-intelligence")
    assert r_ret.status_code == 200
    assert r_ret.json()["catalog_total_reviews"] == 16

    # Decision Queue
    r_dec = client.get("/api/v1/retail/decision-queue")
    assert r_dec.status_code == 200
    assert len(r_dec.json()["decisions"]) == 4
