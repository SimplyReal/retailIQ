"""Automated Tests for RetailIQ Data Foundation.

Validates schemas, primary keys, foreign keys, ranges, timestamps,
and seeded scenarios locally without requiring Google Cloud.
"""

import csv
from pathlib import Path
import pytest
from scripts.validate_datasets import DatasetValidator, MVP_FILES
from scripts.generate_data import generate_all
from data.schemas.models import CustomerModel, ProductModel, OrderModel, InventoryModel


DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "generated"


@pytest.fixture(scope="session")
def validator():
    # Ensure generated data is present
    if not (DATA_DIR / "customers.csv").is_file():
        generate_all(scale="small", seed=42, output_dir=str(DATA_DIR))
    val = DatasetValidator(DATA_DIR)
    loaded = val.load_datasets()
    assert loaded is True, "Failed to load generated datasets"
    return val


def test_mvp_datasets_exist():
    """Verify that all 10 MVP dataset files exist in data/generated/."""
    for fname in MVP_FILES:
        assert (DATA_DIR / fname).is_file(), f"Missing MVP file: {fname}"


def test_validator_clean_pass(validator):
    """Run full validator suite and verify zero errors."""
    validator.validate_primary_keys()
    validator.validate_foreign_keys()
    validator.validate_value_ranges_and_types()
    validator.validate_timestamps()
    validator.validate_seeded_scenarios()
    assert len(validator.errors) == 0, f"Validation errors found: {validator.errors}"


def test_primary_key_uniqueness(validator):
    """Check unique identifiers across master entities."""
    customers = [r["customer_id"] for r in validator.data["customers.csv"]]
    assert len(customers) == len(set(customers))
    
    products = [r["product_id"] for r in validator.data["products.csv"]]
    assert len(products) == len(set(products))
    
    stores = [r["store_id"] for r in validator.data["stores.csv"]]
    assert len(stores) == len(set(stores))
    
    orders = [r["order_id"] for r in validator.data["orders.csv"]]
    assert len(orders) == len(set(orders))


def test_foreign_key_relationships(validator):
    """Verify that all child tables strictly reference existing parent keys."""
    cust_ids = {r["customer_id"] for r in validator.data["customers.csv"]}
    prod_ids = {r["product_id"] for r in validator.data["products.csv"]}
    store_ids = {r["store_id"] for r in validator.data["stores.csv"]}

    for r in validator.data["orders.csv"]:
        assert r["customer_id"] in cust_ids
        assert r["product_id"] in prod_ids

    for r in validator.data["inventory.csv"]:
        assert r["product_id"] in prod_ids
        assert r["store_id"] in store_ids

    for r in validator.data["cart_events.csv"]:
        assert r["customer_id"] in cust_ids
        assert r["product_id"] in prod_ids


def test_seeded_scenario_price_abandonment(validator):
    """Scenario 1: Budget customer abandons cart on premium item."""
    c3 = next(r for r in validator.data["customers.csv"] if r["customer_id"] == "CUST-0003")
    assert c3["price_range"] == "Budget"
    
    p4 = next(r for r in validator.data["products.csv"] if r["product_id"] == "PROD-0004")
    assert float(p4["price"]) > float(c3["avg_order_value"]) * 2
    
    abandonments = [
        r for r in validator.data["cart_events.csv"]
        if r["customer_id"] == "CUST-0003" and r["product_id"] == "PROD-0004" and r["action"] == "abandon"
    ]
    assert len(abandonments) >= 1
    
    orders = [
        r for r in validator.data["orders.csv"]
        if r["customer_id"] == "CUST-0003" and r["product_id"] == "PROD-0004"
    ]
    assert len(orders) == 0


def test_seeded_scenario_unavailable_sizes(validator):
    """Scenario 2: Out of stock item in store."""
    inv = next(
        r for r in validator.data["inventory.csv"]
        if r["product_id"] == "PROD-0002" and r["store_id"] == "STORE-001"
    )
    assert int(inv["stock"]) == 0
    assert inv["availability_time"] == "out_of_stock"


def test_seeded_scenario_stock_imbalance(validator):
    """Scenario 4: PROD-0001 stocked out in flagship STORE-001, overstocked in STORE-004."""
    inv_s1 = next(
        r for r in validator.data["inventory.csv"]
        if r["product_id"] == "PROD-0001" and r["store_id"] == "STORE-001"
    )
    inv_s4 = next(
        r for r in validator.data["inventory.csv"]
        if r["product_id"] == "PROD-0001" and r["store_id"] == "STORE-004"
    )
    assert int(inv_s1["stock"]) <= 5
    assert int(inv_s4["stock"]) >= 50


def test_seeded_scenario_returns_defect(validator):
    """Scenario 5: High return rate on PROD-0006 due to sizing issue."""
    prod6_returns = [
        r for r in validator.data["reviews_returns.csv"]
        if r["product_id"] == "PROD-0006" and r["return_flag"] == "True"
    ]
    assert len(prod6_returns) >= 5
    for ret in prod6_returns:
        assert ret["return_reason"] == "sizing_issue"
        assert int(ret["rating"]) <= 2


def test_pydantic_parsing(validator):
    """Verify records comply with Pydantic V2 models."""
    for row in validator.data["customers.csv"][:5]:
        m = CustomerModel(
            customer_id=row["customer_id"],
            age_group=row["age_group"],
            location=row["location"],
            preferred_category=row["preferred_category"],
            preferred_brands=row["preferred_brands"],
            avg_order_value=float(row["avg_order_value"]),
            price_range=row["price_range"],
            loyalty_tier=row["loyalty_tier"],
        )
        assert m.customer_id.startswith("CUST-")


def test_deterministic_reproducibility(tmp_path):
    """Verify generator is strictly deterministic with identical seeds."""
    dir1 = tmp_path / "run1"
    dir2 = tmp_path / "run2"
    
    generate_all(scale="small", seed=99, output_dir=str(dir1), include_optional=False)
    generate_all(scale="small", seed=99, output_dir=str(dir2), include_optional=False)
    
    for fname in MVP_FILES:
        content1 = (dir1 / fname).read_text(encoding="utf-8")
        content2 = (dir2 / fname).read_text(encoding="utf-8")
        assert content1 == content2, f"Determinism mismatch in {fname}"
