"""Tests for RetailIQ backend foundation endpoints."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /health returns 200 with status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"
    assert "timestamp" in data


def test_system_endpoint():
    """Verify GET /api/v1/system returns system diagnostics and modules."""
    response = client.get("/api/v1/system")
    assert response.status_code == 200
    data = response.json()
    assert data.get("name") == "RetailIQ Backend"
    assert data.get("status") == "ready"
    assert "version" in data
    assert "modules" in data
    modules = data["modules"]
    assert modules.get("customer_intelligence") == "initialized"
    assert modules.get("retail_intelligence") == "initialized"
    assert modules.get("orchestrator") == "initialized"
    assert modules.get("evidence_layer") == "initialized"
