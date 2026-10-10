"""Data Access Layer for RetailIQ Local Datasets.

Safely loads, types, and queries CSV datasets from data/generated/.
Caches loaded tables in memory for fast, deterministic local querying.
"""

import csv
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional


class DataLoader:
    """In-memory data-access layer for RetailIQ CSV datasets."""

    def __init__(self, data_dir: Optional[Path] = None):
        if data_dir is not None:
            self.data_dir = Path(data_dir)
        else:
            env_dir = os.getenv("DATA_DIR")
            if env_dir:
                self.data_dir = Path(env_dir)
            else:
                # Default to <repo_root>/data/generated
                self.data_dir = Path(__file__).resolve().parent.parent.parent.parent / "data" / "generated"
        self._cache: Dict[str, List[Dict[str, Any]]] = {}

    def reload(self) -> None:
        """Clear memory cache to force re-reading CSVs from disk."""
        self._cache.clear()

    def _read_csv(self, filename: str) -> List[Dict[str, Any]]:
        if filename in self._cache:
            return self._cache[filename]

        filepath = self.data_dir / filename
        if not filepath.is_file():
            raise FileNotFoundError(f"Dataset file not found at {filepath.resolve()}")

        rows: List[Dict[str, Any]] = []
        with open(filepath, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)

        self._cache[filename] = rows
        return rows

    def get_customers(self) -> Dict[str, Dict[str, Any]]:
        """Return customers indexed by customer_id."""
        raw = self._read_csv("customers.csv")
        customers = {}
        for r in raw:
            cid = r["customer_id"]
            customers[cid] = {
                "customer_id": cid,
                "age_group": r["age_group"],
                "location": r["location"],
                "preferred_category": r["preferred_category"],
                "preferred_brands": r.get("preferred_brands", ""),
                "avg_order_value": float(r["avg_order_value"]),
                "price_range": r["price_range"],
                "loyalty_tier": r["loyalty_tier"],
            }
        return customers

    def get_products(self) -> Dict[str, Dict[str, Any]]:
        """Return products indexed by product_id."""
        raw = self._read_csv("products.csv")
        products = {}
        for r in raw:
            pid = r["product_id"]
            attrs = r.get("attributes", "{}")
            try:
                parsed_attrs = json.loads(attrs) if isinstance(attrs, str) else attrs
            except Exception:
                parsed_attrs = {}

            products[pid] = {
                "product_id": pid,
                "product_name": r["product_name"],
                "category": r["category"],
                "subcategory": r["subcategory"],
                "brand": r["brand"],
                "price": float(r["price"]),
                "rating": float(r["rating"]),
                "attributes": parsed_attrs,
                "description": r["description"],
            }
        return products

    def get_stores(self) -> Dict[str, Dict[str, Any]]:
        """Return stores indexed by store_id."""
        raw = self._read_csv("stores.csv")
        stores = {}
        for r in raw:
            sid = r["store_id"]
            stores[sid] = {
                "store_id": sid,
                "location": r["location"],
                "format": r["format"],
                "region": r["region"],
            }
        return stores

    def get_inventory(self) -> List[Dict[str, Any]]:
        """Return list of inventory records with typed stock."""
        raw = self._read_csv("inventory.csv")
        return [
            {
                "product_id": r["product_id"],
                "store_id": r["store_id"],
                "stock": int(r["stock"]),
                "availability_time": r["availability_time"],
            }
            for r in raw
        ]

    def get_promotions(self) -> List[Dict[str, Any]]:
        """Return list of promotion records with typed discount."""
        raw = self._read_csv("promotions.csv")
        return [
            {
                "product_id": r["product_id"],
                "campaign": r["campaign"],
                "discount": float(r["discount"]),
                "start_date": r["start_date"],
                "end_date": r["end_date"],
                "channel": r["channel"],
            }
            for r in raw
        ]

    def get_orders(self) -> List[Dict[str, Any]]:
        """Return list of order records with typed price, discount, and quantity."""
        raw = self._read_csv("orders.csv")
        return [
            {
                "order_id": r["order_id"],
                "customer_id": r["customer_id"],
                "product_id": r["product_id"],
                "quantity": int(r["quantity"]),
                "price": float(r["price"]),
                "discount": float(r["discount"]),
                "order_date": r["order_date"],
                "channel": r["channel"],
            }
            for r in raw
        ]

    def get_cart_events(self) -> List[Dict[str, Any]]:
        """Return list of cart events."""
        raw = self._read_csv("cart_events.csv")
        return [
            {
                "event_id": r["event_id"],
                "customer_id": r["customer_id"],
                "product_id": r["product_id"],
                "action": r["action"],
                "quantity": int(r["quantity"]),
                "timestamp": r["timestamp"],
            }
            for r in raw
        ]

    def get_reviews_returns(self) -> List[Dict[str, Any]]:
        """Return list of reviews and returns with typed rating and boolean flag."""
        raw = self._read_csv("reviews_returns.csv")
        return [
            {
                "customer_id": r["customer_id"],
                "product_id": r["product_id"],
                "rating": int(r["rating"]),
                "review_text": r["review_text"],
                "return_flag": r["return_flag"] in ("True", "true", True),
                "return_reason": r.get("return_reason") or "",
                "date": r["date"],
            }
            for r in raw
        ]

    def get_search_events(self) -> List[Dict[str, Any]]:
        """Return list of customer search queries."""
        raw = self._read_csv("search_events.csv")
        return list(raw)

    def get_browsing_events(self) -> List[Dict[str, Any]]:
        """Return list of browsing event clickstream."""
        raw = self._read_csv("browsing_events.csv")
        return [
            {
                "event_id": r["event_id"],
                "customer_id": r["customer_id"],
                "product_id": r["product_id"],
                "event_type": r["event_type"],
                "duration": int(r["duration"]),
                "timestamp": r["timestamp"],
            }
            for r in raw
        ]


# Default singleton instance
default_data_loader = DataLoader()
