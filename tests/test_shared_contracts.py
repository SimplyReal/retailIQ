"""Unit and Integration Tests for RetailIQ Shared Intelligence Contracts."""

import json
import pytest
from pydantic import ValidationError
from backend.app.common.schemas import (
    Evidence,
    Recommendation,
    AgentResult,
    InvestigationRequest,
    InvestigationResponse,
)


# ----------------------------------------------------------------------
# 1. Evidence Tests
# ----------------------------------------------------------------------

def test_evidence_valid_construction():
    """Verify Evidence builds correctly with multiple supported types and value types."""
    e_metric = Evidence(
        type="metric",
        label="Return Rate",
        value=0.38,
        source="bigquery.analytics.returns",
    )
    assert e_metric.type == "metric"
    assert e_metric.label == "Return Rate"
    assert e_metric.value == 0.38
    assert e_metric.source == "bigquery.analytics.returns"

    e_data = Evidence(
        type="data_point",
        label="Store On-Hand Stock",
        value={"store_id": "STORE-001", "stock": 2},
        source="inventory.csv",
    )
    assert e_data.value["stock"] == 2

    e_retrieval = Evidence(
        type="retrieval",
        label="Customer Review Sentiment",
        value=["Runs small", "Tight in shoulders"],
        source="reviews_returns.csv",
    )
    assert len(e_retrieval.value) == 2


def test_evidence_invalid_type():
    """Verify invalid evidence type is rejected."""
    with pytest.raises(ValidationError):
        Evidence(
            type="unsupported_type",  # type: ignore
            label="Metric Label",
            value=10,
            source="source.csv",
        )


def test_evidence_empty_text():
    """Verify empty or whitespace-only labels and sources are rejected."""
    with pytest.raises(ValidationError):
        Evidence(type="metric", label="", value=10, source="source.csv")

    with pytest.raises(ValidationError):
        Evidence(type="metric", label="   ", value=10, source="source.csv")

    with pytest.raises(ValidationError):
        Evidence(type="metric", label="Valid", value=10, source="   ")


# ----------------------------------------------------------------------
# 2. Recommendation Tests
# ----------------------------------------------------------------------

def test_recommendation_valid_construction():
    """Verify Recommendation builds and normalizes priority."""
    r1 = Recommendation(
        action="Transfer 30 units from STORE-004 to STORE-001",
        rationale="Stockout risk in flagship store with high sales velocity",
        expected_impact="Avoid estimated ₹1,05,000 in lost weekly revenue",
        priority="HIGH",
        confidence=0.88,
    )
    assert r1.priority == "HIGH"
    assert r1.confidence == 0.88

    # Test case-insensitive normalization: "medium" -> "MEDIUM"
    r2 = Recommendation(
        action="Initiate size audit for PROD-0006",
        rationale="Return rate exceeds 35% with repeated sizing complaints",
        expected_impact="Reduce return processing costs",
        priority="medium",  # type: ignore
    )
    assert r2.priority == "MEDIUM"


def test_recommendation_invalid_priority():
    """Verify invalid priority strings are rejected."""
    with pytest.raises(ValidationError):
        Recommendation(
            action="Action",
            rationale="Rationale",
            expected_impact="Impact",
            priority="CRITICAL",  # type: ignore
        )


def test_recommendation_empty_text():
    """Verify whitespace-only or empty strings are rejected."""
    with pytest.raises(ValidationError):
        Recommendation(
            action="   ",
            rationale="Valid Rationale",
            expected_impact="Valid Impact",
            priority="LOW",
        )


def test_recommendation_invalid_confidence():
    """Verify recommendation confidence enforces [0.0, 1.0]."""
    with pytest.raises(ValidationError):
        Recommendation(
            action="Action",
            rationale="Rationale",
            expected_impact="Impact",
            priority="LOW",
            confidence=1.2,
        )

    with pytest.raises(ValidationError):
        Recommendation(
            action="Action",
            rationale="Rationale",
            expected_impact="Impact",
            priority="LOW",
            confidence=-0.1,
        )


# ----------------------------------------------------------------------
# 3. AgentResult Tests
# ----------------------------------------------------------------------

def test_agent_result_valid_construction():
    """Verify AgentResult construction with multiple evidence items and recommendations."""
    evidence1 = Evidence(
        type="metric",
        label="Period 1 vs 2 Revenue Delta",
        value="-42.5%",
        source="orders.csv",
    )
    evidence2 = Evidence(
        type="event",
        label="Promotion Expiration Date",
        value="2026-09-15",
        source="promotions.csv",
    )
    rec1 = Recommendation(
        action="Extend targeted 15% promotional campaign",
        rationale="Sales velocity dropped 80% immediately following discount expiry",
        expected_impact="Restore weekly unit run rate to 12 units",
        priority="HIGH",
    )

    result = AgentResult(
        agent="Sales Investigation Agent",
        finding="Revenue drop was driven by campaign discount expiration rather than catalog churn.",
        evidence=[evidence1, evidence2],
        confidence=0.91,
        recommendations=[rec1],
        sources=["orders.csv", "promotions.csv"],
    )

    assert result.agent == "Sales Investigation Agent"
    assert len(result.evidence) == 2
    assert result.confidence == 0.91
    assert len(result.recommendations) == 1
    assert result.sources == ["orders.csv", "promotions.csv"]


def test_agent_result_confidence_boundaries():
    """Verify confidence allows 0.0 and 1.0, but rejects <0 or >1."""
    # Boundary 0.0
    res_zero = AgentResult(
        agent="Test Agent",
        finding="Finding text",
        confidence=0.0,
    )
    assert res_zero.confidence == 0.0

    # Boundary 1.0
    res_one = AgentResult(
        agent="Test Agent",
        finding="Finding text",
        confidence=1.0,
    )
    assert res_one.confidence == 1.0

    # Out of bounds: > 1.0
    with pytest.raises(ValidationError):
        AgentResult(
            agent="Test Agent",
            finding="Finding text",
            confidence=1.01,
        )

    # Out of bounds: < 0.0
    with pytest.raises(ValidationError):
        AgentResult(
            agent="Test Agent",
            finding="Finding text",
            confidence=-0.05,
        )


def test_agent_result_missing_fields():
    """Verify missing required fields raise ValidationError."""
    with pytest.raises(ValidationError):
        AgentResult(agent="Agent Only")  # type: ignore

    with pytest.raises(ValidationError):
        AgentResult(finding="Finding Only")  # type: ignore


def test_agent_result_empty_text():
    """Verify empty text in agent name, finding, or sources is rejected."""
    with pytest.raises(ValidationError):
        AgentResult(agent="", finding="Finding", confidence=0.8)

    with pytest.raises(ValidationError):
        AgentResult(agent="Agent", finding="   ", confidence=0.8)

    with pytest.raises(ValidationError):
        AgentResult(
            agent="Agent",
            finding="Finding",
            confidence=0.8,
            sources=["orders.csv", "   "],
        )


# ----------------------------------------------------------------------
# 4. InvestigationRequest Tests
# ----------------------------------------------------------------------

def test_investigation_request_valid():
    """Verify valid request creation with minimal and full parameters."""
    # Minimal
    req_min = InvestigationRequest(query="Why did sales drop in Mumbai?")
    assert req_min.query == "Why did sales drop in Mumbai?"
    assert req_min.customer_id is None
    assert req_min.product_id is None

    # Full
    req_full = InvestigationRequest(
        query="Investigate checkout abandonment for customer CUST-0003",
        customer_id="CUST-0003",
        product_id="PROD-0004",
        store_id="STORE-001",
        order_id="ORD-00005",
        domain="cross_domain",
        parameters={"lookback_days": 14},
    )
    assert req_full.customer_id == "CUST-0003"
    assert req_full.domain == "cross_domain"
    assert req_full.parameters["lookback_days"] == 14


def test_investigation_request_empty_query():
    """Verify empty or whitespace query is rejected."""
    with pytest.raises(ValidationError):
        InvestigationRequest(query="")

    with pytest.raises(ValidationError):
        InvestigationRequest(query="     ")


def test_investigation_request_empty_optional_id():
    """Verify whitespace-only optional identifiers are rejected."""
    with pytest.raises(ValidationError):
        InvestigationRequest(query="Valid query", customer_id="   ")


# ----------------------------------------------------------------------
# 5. InvestigationResponse & Domain-Neutral Integration Tests
# ----------------------------------------------------------------------

def test_investigation_response_domain_neutral_assembly():
    """Verify response can combine Customer and Retail agent results seamlessly."""
    req = InvestigationRequest(
        query="Investigate lost sale and inventory connection",
        customer_id="CUST-0002",
        product_id="PROD-0002",
        store_id="STORE-001",
        domain="cross_domain",
    )

    # Customer Intelligence Agent Result
    customer_result = AgentResult(
        agent="Lost Sale Investigation Agent",
        finding="Customer attempted purchase of size UK 9 but encountered out-of-stock state in local store.",
        evidence=[
            Evidence(
                type="event",
                label="Cart Abandonment Action",
                value={"action": "abandon", "quantity": 1},
                source="cart_events.csv",
            ),
        ],
        confidence=0.92,
        recommendations=[
            Recommendation(
                action="Suggest in-stock alternative PROD-0001",
                rationale="Matches running/trail category and customer price bracket",
                expected_impact="Recover lost transaction",
                priority="HIGH",
            )
        ],
        sources=["cart_events.csv"],
    )

    # Retail / Business Intelligence Agent Result
    retail_result = AgentResult(
        agent="Supply-Demand Intelligence Agent",
        finding="Local stockout at STORE-001 for PROD-0002 while STORE-003 has available stock.",
        evidence=[
            Evidence(
                type="data_point",
                label="STORE-001 Stock Position",
                value=0,
                source="inventory.csv",
            ),
            Evidence(
                type="data_point",
                label="STORE-003 Stock Position",
                value=12,
                source="inventory.csv",
            ),
        ],
        confidence=0.89,
        recommendations=[
            Recommendation(
                action="Trigger inter-store inventory replenishment to STORE-001",
                rationale="Fulfill local demand buffer for high-interest size UK 9",
                expected_impact="Prevent repeat lost sales",
                priority="MEDIUM",
            )
        ],
        sources=["inventory.csv"],
    )

    response = InvestigationResponse(
        request=req,
        status="completed",
        findings=[customer_result, retail_result],
        summary="Customer abandonment was directly caused by localized stockout at STORE-001.",
        metadata={"orchestrator_latency_ms": 42},
    )

    assert response.investigation_id.startswith("INV-")
    assert response.status == "completed"
    assert len(response.findings) == 2
    assert response.findings[0].agent == "Lost Sale Investigation Agent"
    assert response.findings[1].agent == "Supply-Demand Intelligence Agent"
    assert response.metadata["orchestrator_latency_ms"] == 42


def test_json_serialization_roundtrip():
    """Verify all contracts serialize to valid JSON and deserialize back identically."""
    req = InvestigationRequest(
        query="Why did sales decrease?",
        product_id="PROD-0005",
        domain="retail",
    )
    result = AgentResult(
        agent="Sales Investigation Agent",
        finding="Sales decreased by 42% due to end of promotion.",
        evidence=[
            Evidence(
                type="metric",
                label="Sales Variance",
                value={"prior_period": 9, "current_period": 2},
                source="orders.csv",
            )
        ],
        confidence=0.87,
        recommendations=[
            Recommendation(
                action="Renew promotion",
                rationale="Sustain volume",
                expected_impact="+30% units",
                priority="HIGH",
                confidence=0.85,
            )
        ],
        sources=["orders.csv", "promotions.csv"],
    )
    resp = InvestigationResponse(
        request=req,
        findings=[result],
        summary="Promotion expiration caused demand drop.",
    )

    # Serialize to JSON string
    json_str = resp.model_dump_json(indent=2)
    assert isinstance(json_str, str)

    # Parse raw json to check structure
    parsed_json = json.loads(json_str)
    assert parsed_json["status"] == "completed"
    assert parsed_json["findings"][0]["confidence"] == 0.87
    assert parsed_json["findings"][0]["evidence"][0]["value"]["current_period"] == 2

    # Validate back through Pydantic
    deserialized = InvestigationResponse.model_validate_json(json_str)
    assert deserialized.investigation_id == resp.investigation_id
    assert deserialized.findings[0].agent == "Sales Investigation Agent"
    assert deserialized.findings[0].recommendations[0].priority == "HIGH"
