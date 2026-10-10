"""Comprehensive Tests for RetailIQ Local Investigation Engine and API."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.common.schemas import InvestigationRequest, InvestigationResponse
from backend.app.services.data_loader import DataLoader
from backend.app.services.investigation_service import (
    InvestigationService,
    default_investigation_service,
)

client = TestClient(app)


# ----------------------------------------------------------------------
# 1. Data Loader Tests
# ----------------------------------------------------------------------

def test_data_loader_typed_access():
    """Verify DataLoader reads and casts CSV records properly."""
    loader = DataLoader()
    customers = loader.get_customers()
    products = loader.get_products()
    inventory = loader.get_inventory()
    orders = loader.get_orders()
    reviews = loader.get_reviews_returns()

    assert len(customers) >= 20
    assert "CUST-0003" in customers
    assert isinstance(customers["CUST-0003"]["avg_order_value"], float)

    assert len(products) >= 15
    assert "PROD-0004" in products
    assert isinstance(products["PROD-0004"]["price"], float)
    assert isinstance(products["PROD-0004"]["attributes"], dict)

    assert len(inventory) >= 70
    assert isinstance(inventory[0]["stock"], int)

    assert len(orders) >= 25
    assert isinstance(orders[0]["price"], float)

    assert len(reviews) >= 10
    assert isinstance(reviews[0]["return_flag"], bool)


# ----------------------------------------------------------------------
# 2. Scenario 1: Cart Abandonment & Price Mismatch
# ----------------------------------------------------------------------

def test_scenario_cart_abandonment():
    """Verify Scenario 1 identifies price mismatch and evidence from real rows."""
    service = InvestigationService()
    req = InvestigationRequest(
        query="Investigate checkout abandonment on running shoes for customer CUST-0003",
        customer_id="CUST-0003",
        product_id="PROD-0004",
    )
    resp = service.investigate(req)

    assert resp.status == "completed"
    assert len(resp.findings) == 1

    finding = resp.findings[0]
    assert finding.agent == "Lost Sale Investigation Agent"
    assert finding.confidence >= 0.90
    assert "PROD-0004" in finding.finding or "Apex Carbon" in finding.finding

    # Check evidence accuracy
    ev_types = {e.label: e for e in finding.evidence}
    assert "Customer Purchasing Profile" in ev_types
    assert ev_types["Customer Purchasing Profile"].value["price_range"] == "Budget"
    assert ev_types["Customer Purchasing Profile"].value["avg_order_value"] == 2400.0

    assert "Target Product Pricing" in ev_types
    assert ev_types["Target Product Pricing"].value["price"] == 6499.0

    assert "Price Mismatch Metrics" in ev_types
    assert ev_types["Price Mismatch Metrics"].value["price_to_aov_ratio"] == "2.71x"

    # Verify recommendations
    assert len(finding.recommendations) >= 1
    assert finding.recommendations[0].priority == "HIGH"


# ----------------------------------------------------------------------
# 3. Scenario 2: Stockout & Cross-Store Inventory Imbalance
# ----------------------------------------------------------------------

def test_scenario_inventory_imbalance():
    """Verify Scenario 2 calculates store stock imbalance and recommends transfer."""
    service = InvestigationService()
    req = InvestigationRequest(
        query="Investigate inventory imbalance and stockout risk across retail stores",
        product_id="PROD-0001",
    )
    resp = service.investigate(req)

    assert resp.status == "completed"
    assert len(resp.findings) == 1

    finding = resp.findings[0]
    assert finding.agent == "Supply-Demand Intelligence Agent"
    assert finding.confidence >= 0.90

    # Check evidence contains deficit and surplus stores
    ev_map = {e.label: e for e in finding.evidence}
    assert "Deficit Store Stock (STORE-001)" in ev_map
    assert ev_map["Deficit Store Stock (STORE-001)"].value["stock"] == 2

    assert "Surplus Store Stock (STORE-004)" in ev_map
    assert ev_map["Surplus Store Stock (STORE-004)"].value["stock"] == 85

    # Check recommendations
    assert len(finding.recommendations) >= 1
    rec = finding.recommendations[0]
    assert "STORE-004" in rec.action and "STORE-001" in rec.action
    assert rec.priority == "HIGH"


# ----------------------------------------------------------------------
# 4. Scenario 3: Sales Decline After Promotion Ends
# ----------------------------------------------------------------------

def test_scenario_sales_decline():
    """Verify Scenario 3 partitions orders before and after campaign end date."""
    service = InvestigationService()
    req = InvestigationRequest(
        query="Why did sales drop for seamless training tee after the campaign ended?",
        product_id="PROD-0005",
    )
    resp = service.investigate(req)

    assert resp.status == "completed"
    assert len(resp.findings) == 1

    finding = resp.findings[0]
    assert finding.agent == "Sales Investigation Agent"
    assert finding.confidence >= 0.85

    # Check evidence for volume and revenue drop
    ev_map = {e.label: e for e in finding.evidence}
    assert "Order Volume Comparison" in ev_map
    vol_data = ev_map["Order Volume Comparison"].value
    assert vol_data["period_1_promo_orders"] > vol_data["period_2_post_promo_orders"]
    assert vol_data["period_1_promo_orders"] == 9
    assert vol_data["period_2_post_promo_orders"] == 2

    assert "Promotional Campaign Lifecycle" in ev_map
    promo_data = ev_map["Promotional Campaign Lifecycle"].value
    assert promo_data["campaign_name"] == "MonsoonClearanceEarly"
    assert promo_data["discount_applied"] == 400.0


# ----------------------------------------------------------------------
# 5. Scenario 4: High Return Rate & Sizing Complaints
# ----------------------------------------------------------------------

def test_scenario_return_defects():
    """Verify Scenario 4 calculates return rate and extracts real customer feedback quotes."""
    service = InvestigationService()
    req = InvestigationRequest(
        query="Investigate high customer returns and defect complaints on jacket",
        product_id="PROD-0006",
    )
    resp = service.investigate(req)

    assert resp.status == "completed"
    assert len(resp.findings) == 1

    finding = resp.findings[0]
    assert finding.agent == "Return Intelligence Agent"
    assert finding.confidence >= 0.90

    ev_map = {e.label: e for e in finding.evidence}
    assert "Product Return Rate and Customer Rating" in ev_map
    ret_data = ev_map["Product Return Rate and Customer Rating"].value
    assert ret_data["units_returned"] == 8
    assert ret_data["return_rate_pct"] == "80.0%"

    assert "Verified Customer Feedback Quotes" in ev_map
    quotes = ev_map["Verified Customer Feedback Quotes"].value
    assert len(quotes) >= 1
    assert "smaller" in quotes[0].lower() or "tight" in quotes[0].lower()


# ----------------------------------------------------------------------
# 6. Unsupported Query Handling
# ----------------------------------------------------------------------

def test_unsupported_query_returns_clear_response():
    """Verify engine returns non-hallucinated response when query has no matching scenario."""
    service = InvestigationService()
    req = InvestigationRequest(
        query="What is the weather forecast in Tokyo tomorrow?",
    )
    resp = service.investigate(req)

    assert resp.status == "completed"
    assert len(resp.findings) == 0
    assert "No matching investigation scenario detected" in resp.summary
    assert resp.metadata["query_matched"] is False
    assert len(resp.metadata["supported_scenarios"]) == 4


# ----------------------------------------------------------------------
# 7. API Integration Tests (POST /api/v1/investigations)
# ----------------------------------------------------------------------

def test_api_investigations_cart_abandonment():
    """Verify POST /api/v1/investigations processes cart abandonment request."""
    payload = {
        "query": "Investigate cart abandonment for budget runner",
        "customer_id": "CUST-0003",
        "product_id": "PROD-0004",
        "domain": "customer",
    }
    response = client.post("/api/v1/investigations", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "completed"
    assert len(data["findings"]) == 1
    assert data["findings"][0]["agent"] == "Lost Sale Investigation Agent"
    assert data["metadata"]["query_matched"] is True


def test_api_investigations_unsupported_query():
    """Verify POST /api/v1/investigations handles unsupported query via HTTP."""
    payload = {
        "query": "Can you recommend a recipe for chocolate cake?",
    }
    response = client.post("/api/v1/investigations", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "completed"
    assert len(data["findings"]) == 0
    assert "No matching investigation scenario" in data["summary"]
    assert data["metadata"]["query_matched"] is False


def test_api_investigations_validation_error():
    """Verify POST /api/v1/investigations rejects empty query with 422 Unprocessable Entity."""
    payload = {
        "query": "   ",
    }
    response = client.post("/api/v1/investigations", json=payload)
    assert response.status_code == 422
