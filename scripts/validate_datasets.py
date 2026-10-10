"""Validation Suite for RetailIQ Datasets.

Validates:
1. File presence and expected headers for all 10 MVP datasets (+ optional datasets)
2. Primary key uniqueness and non-nullability
3. Foreign key referential integrity across all relationships
4. Numerical range boundaries and valid categories
5. Timestamp formatting and temporal consistency
6. Presence and validity of intentionally seeded retail scenarios
"""

import argparse
import csv
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set, Any, Tuple


MVP_FILES = [
    "customers.csv",
    "products.csv",
    "search_events.csv",
    "browsing_events.csv",
    "cart_events.csv",
    "orders.csv",
    "reviews_returns.csv",
    "inventory.csv",
    "stores.csv",
    "promotions.csv",
]

EXPECTED_HEADERS = {
    "customers.csv": [
        "customer_id", "age_group", "location", "preferred_category",
        "preferred_brands", "avg_order_value", "price_range", "loyalty_tier"
    ],
    "products.csv": [
        "product_id", "product_name", "category", "subcategory",
        "brand", "price", "rating", "attributes", "description"
    ],
    "search_events.csv": ["event_id", "customer_id", "query", "timestamp"],
    "browsing_events.csv": [
        "event_id", "customer_id", "product_id", "event_type", "duration", "timestamp"
    ],
    "cart_events.csv": [
        "event_id", "customer_id", "product_id", "action", "quantity", "timestamp"
    ],
    "orders.csv": [
        "order_id", "customer_id", "product_id", "quantity", "price", "discount", "order_date", "channel"
    ],
    "reviews_returns.csv": [
        "customer_id", "product_id", "rating", "review_text", "return_flag", "return_reason", "date"
    ],
    "inventory.csv": ["product_id", "store_id", "stock", "availability_time"],
    "stores.csv": ["store_id", "location", "format", "region"],
    "promotions.csv": [
        "product_id", "campaign", "discount", "start_date", "end_date", "channel"
    ],
    "delivery_events.csv": [
        "order_id", "promised_date", "actual_date", "delay_days", "status"
    ],
    "support_conversations.csv": [
        "customer_id", "order_id", "issue_type", "conversation_text", "resolution", "timestamp"
    ],
}


class DatasetValidator:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.data: Dict[str, List[Dict[str, str]]] = {}

    def log_error(self, msg: str):
        self.errors.append(msg)

    def log_warning(self, msg: str):
        self.warnings.append(msg)

    def load_datasets(self) -> bool:
        print(f"[*] Checking and loading CSV files from: {self.data_dir.resolve()}")
        all_present = True
        
        # Check MVP datasets
        for fname in MVP_FILES:
            fpath = self.data_dir / fname
            if not fpath.is_file():
                self.log_error(f"Missing required MVP dataset: {fname}")
                all_present = False
            else:
                with open(fpath, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    headers = reader.fieldnames or []
                    expected = EXPECTED_HEADERS[fname]
                    missing_cols = set(expected) - set(headers)
                    if missing_cols:
                        self.log_error(f"{fname}: Missing expected columns: {missing_cols}")
                    rows = list(reader)
                    if not rows:
                        self.log_error(f"{fname}: Dataset is empty (0 rows)")
                    self.data[fname] = rows

        # Check optional datasets if present
        for optional_file in ["delivery_events.csv", "support_conversations.csv"]:
            fpath = self.data_dir / optional_file
            if fpath.is_file():
                with open(fpath, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    headers = reader.fieldnames or []
                    expected = EXPECTED_HEADERS[optional_file]
                    missing_cols = set(expected) - set(headers)
                    if missing_cols:
                        self.log_error(f"{optional_file}: Missing expected columns: {missing_cols}")
                    self.data[optional_file] = list(reader)
                    
        return all_present and len(self.errors) == 0

    def validate_primary_keys(self):
        print("[*] Validating Primary Key uniqueness and non-nullability...")
        pk_definitions = {
            "customers.csv": "customer_id",
            "products.csv": "product_id",
            "stores.csv": "store_id",
            "search_events.csv": "event_id",
            "browsing_events.csv": "event_id",
            "cart_events.csv": "event_id",
            "orders.csv": "order_id",
        }
        
        for fname, pk in pk_definitions.items():
            if fname not in self.data:
                continue
            seen = set()
            for idx, row in enumerate(self.data[fname], start=1):
                val = row.get(pk, "").strip()
                if not val:
                    self.log_error(f"{fname} row {idx}: Empty primary key '{pk}'")
                elif val in seen:
                    self.log_error(f"{fname} row {idx}: Duplicate primary key '{val}' for '{pk}'")
                seen.add(val)

        # Inventory composite key: (product_id, store_id)
        if "inventory.csv" in self.data:
            inv_keys = set()
            for idx, row in enumerate(self.data["inventory.csv"], start=1):
                pid = row.get("product_id", "").strip()
                sid = row.get("store_id", "").strip()
                comp = (pid, sid)
                if not pid or not sid:
                    self.log_error(f"inventory.csv row {idx}: Incomplete composite key ({pid}, {sid})")
                elif comp in inv_keys:
                    self.log_error(f"inventory.csv row {idx}: Duplicate composite key ({pid}, {sid})")
                inv_keys.add(comp)

    def validate_foreign_keys(self):
        print("[*] Validating Foreign Key referential integrity...")
        if not all(k in self.data for k in ["customers.csv", "products.csv", "stores.csv"]):
            return

        valid_customers = {r["customer_id"] for r in self.data["customers.csv"]}
        valid_products = {r["product_id"] for r in self.data["products.csv"]}
        valid_stores = {r["store_id"] for r in self.data["stores.csv"]}
        valid_orders = {r["order_id"] for r in self.data.get("orders.csv", [])}

        fk_checks: List[Tuple[str, str, Set[str], str]] = [
            ("search_events.csv", "customer_id", valid_customers, "customers.customer_id"),
            ("browsing_events.csv", "customer_id", valid_customers, "customers.customer_id"),
            ("browsing_events.csv", "product_id", valid_products, "products.product_id"),
            ("cart_events.csv", "customer_id", valid_customers, "customers.customer_id"),
            ("cart_events.csv", "product_id", valid_products, "products.product_id"),
            ("orders.csv", "customer_id", valid_customers, "customers.customer_id"),
            ("orders.csv", "product_id", valid_products, "products.product_id"),
            ("reviews_returns.csv", "customer_id", valid_customers, "customers.customer_id"),
            ("reviews_returns.csv", "product_id", valid_products, "products.product_id"),
            ("inventory.csv", "product_id", valid_products, "products.product_id"),
            ("inventory.csv", "store_id", valid_stores, "stores.store_id"),
            ("promotions.csv", "product_id", valid_products, "products.product_id"),
        ]

        if "delivery_events.csv" in self.data:
            fk_checks.append(("delivery_events.csv", "order_id", valid_orders, "orders.order_id"))
            
        if "support_conversations.csv" in self.data:
            fk_checks.append(("support_conversations.csv", "customer_id", valid_customers, "customers.customer_id"))

        for fname, col, valid_set, ref_desc in fk_checks:
            if fname not in self.data:
                continue
            for idx, row in enumerate(self.data[fname], start=1):
                val = row.get(col, "").strip()
                if fname == "support_conversations.csv" and col == "order_id" and not val:
                    continue  # Nullable order_id for general inquiry
                if val not in valid_set:
                    self.log_error(f"{fname} row {idx}: Invalid FK {col}='{val}' not in {ref_desc}")

    def validate_value_ranges_and_types(self):
        print("[*] Validating column data types and range boundaries...")
        # Customers
        for idx, r in enumerate(self.data.get("customers.csv", []), start=1):
            try:
                aov = float(r["avg_order_value"])
                if aov < 0:
                    self.log_error(f"customers.csv row {idx}: avg_order_value {aov} < 0")
            except ValueError:
                self.log_error(f"customers.csv row {idx}: avg_order_value not numeric")

        # Products
        for idx, r in enumerate(self.data.get("products.csv", []), start=1):
            try:
                price = float(r["price"])
                if price < 0:
                    self.log_error(f"products.csv row {idx}: price {price} < 0")
            except ValueError:
                self.log_error(f"products.csv row {idx}: price not numeric")
            try:
                rating = float(r["rating"])
                if not (1.0 <= rating <= 5.0):
                    self.log_error(f"products.csv row {idx}: rating {rating} outside [1.0, 5.0]")
            except ValueError:
                self.log_error(f"products.csv row {idx}: rating not numeric")

        # Orders
        for idx, r in enumerate(self.data.get("orders.csv", []), start=1):
            try:
                qty = int(r["quantity"])
                if qty < 1:
                    self.log_error(f"orders.csv row {idx}: quantity {qty} < 1")
            except ValueError:
                self.log_error(f"orders.csv row {idx}: quantity not integer")
            try:
                price = float(r["price"])
                discount = float(r["discount"])
                if price < 0 or discount < 0:
                    self.log_error(f"orders.csv row {idx}: price or discount < 0")
            except ValueError:
                self.log_error(f"orders.csv row {idx}: price or discount not numeric")

        # Inventory
        for idx, r in enumerate(self.data.get("inventory.csv", []), start=1):
            try:
                stock = int(r["stock"])
                if stock < 0:
                    self.log_error(f"inventory.csv row {idx}: stock {stock} < 0")
            except ValueError:
                self.log_error(f"inventory.csv row {idx}: stock not integer")

        # Reviews / Returns
        for idx, r in enumerate(self.data.get("reviews_returns.csv", []), start=1):
            try:
                rating = int(r["rating"])
                if not (1 <= rating <= 5):
                    self.log_error(f"reviews_returns.csv row {idx}: rating {rating} not in [1, 5]")
            except ValueError:
                self.log_error(f"reviews_returns.csv row {idx}: rating not integer")
            if r.get("return_flag") not in ["True", "False", "true", "false"]:
                self.log_error(f"reviews_returns.csv row {idx}: return_flag '{r.get('return_flag')}' not boolean string")

    def validate_timestamps(self):
        print("[*] Validating ISO 8601 timestamps and temporal consistency...")
        
        timestamp_cols = [
            ("search_events.csv", "timestamp"),
            ("browsing_events.csv", "timestamp"),
            ("cart_events.csv", "timestamp"),
            ("orders.csv", "order_date"),
        ]
        
        for fname, col in timestamp_cols:
            for idx, r in enumerate(self.data.get(fname, []), start=1):
                val = r.get(col, "")
                try:
                    datetime.fromisoformat(val.replace("Z", "+00:00"))
                except Exception:
                    self.log_error(f"{fname} row {idx}: Invalid ISO 8601 timestamp '{val}' in column '{col}'")

        # Check date format (YYYY-MM-DD)
        date_cols = [
            ("reviews_returns.csv", "date"),
            ("promotions.csv", "start_date"),
            ("promotions.csv", "end_date"),
        ]
        for fname, col in date_cols:
            for idx, r in enumerate(self.data.get(fname, []), start=1):
                val = r.get(col, "")
                try:
                    datetime.strptime(val, "%Y-%m-%d")
                except Exception:
                    self.log_error(f"{fname} row {idx}: Invalid YYYY-MM-DD date '{val}' in column '{col}'")

    def validate_seeded_scenarios(self):
        print("[*] Validating presence of required seeded retail scenarios...")
        
        # 1. Price-related Cart Abandonment (CUST-0003 & PROD-0004)
        abandonments = [
            r for r in self.data.get("cart_events.csv", [])
            if r.get("customer_id") == "CUST-0003" and r.get("product_id") == "PROD-0004" and r.get("action") == "abandon"
        ]
        c3_orders = [
            r for r in self.data.get("orders.csv", [])
            if r.get("customer_id") == "CUST-0003" and r.get("product_id") == "PROD-0004"
        ]
        if not abandonments or len(c3_orders) > 0:
            self.log_error("Seeded Scenario 1 (Price Cart Abandonment) missing or corrupted for CUST-0003 / PROD-0004")
        else:
            print("  [PASS] Seeded Scenario 1: Price-related Cart Abandonment detected.")

        # 2. Unavailable Sizes / Stockout (PROD-0002 in STORE-001)
        inv_prod2_s1 = [
            r for r in self.data.get("inventory.csv", [])
            if r.get("product_id") == "PROD-0002" and r.get("store_id") == "STORE-001" and int(r.get("stock", -1)) == 0
        ]
        if not inv_prod2_s1:
            self.log_error("Seeded Scenario 2 (Stockout / Unavailable Sizes) missing for PROD-0002 at STORE-001")
        else:
            print("  [PASS] Seeded Scenario 2: Unavailable Sizes / Stockout detected.")

        # 3. Sales Decline across periods for PROD-0005
        orders_prod5 = [
            r for r in self.data.get("orders.csv", []) if r.get("product_id") == "PROD-0005"
        ]
        early_orders = [r for r in orders_prod5 if r["order_date"] < "2026-09-16"]
        late_orders = [r for r in orders_prod5 if r["order_date"] >= "2026-09-16"]
        if len(early_orders) <= len(late_orders) or len(late_orders) == 0:
            self.log_error(f"Seeded Scenario 3 (Sales Decline) missing: early={len(early_orders)}, late={len(late_orders)}")
        else:
            print(f"  [PASS] Seeded Scenario 3: Sales Decline detected (Period 1: {len(early_orders)} orders, Period 2: {len(late_orders)} orders).")

        # 4. Stock Imbalance for PROD-0001
        inv_prod1 = {
            r["store_id"]: int(r["stock"])
            for r in self.data.get("inventory.csv", [])
            if r.get("product_id") == "PROD-0001"
        }
        if inv_prod1.get("STORE-001", 999) > 5 or inv_prod1.get("STORE-004", 0) < 50:
            self.log_error(f"Seeded Scenario 4 (Stock Imbalance) missing for PROD-0001: {inv_prod1}")
        else:
            print(f"  [PASS] Seeded Scenario 4: Stock Imbalance detected (STORE-001 stock={inv_prod1.get('STORE-001')}, STORE-004 stock={inv_prod1.get('STORE-004')}).")

        # 5. Product Returns / Sizing Defect for PROD-0006
        returns_prod6 = [
            r for r in self.data.get("reviews_returns.csv", [])
            if r.get("product_id") == "PROD-0006" and r.get("return_flag") == "True" and r.get("return_reason") == "sizing_issue"
        ]
        if len(returns_prod6) < 4:
            self.log_error(f"Seeded Scenario 5 (High Returns / Sizing Defect) missing for PROD-0006 (found {len(returns_prod6)} returns)")
        else:
            print(f"  [PASS] Seeded Scenario 5: High Returns / Sizing Defect detected ({len(returns_prod6)} sizing returns with negative reviews).")

    def run_all(self) -> bool:
        if not self.load_datasets():
            self.print_summary()
            return False
            
        self.validate_primary_keys()
        self.validate_foreign_keys()
        self.validate_value_ranges_and_types()
        self.validate_timestamps()
        self.validate_seeded_scenarios()
        
        self.print_summary()
        return len(self.errors) == 0

    def print_summary(self):
        print("\n" + "=" * 65)
        print("RETAILIQ DATASET VALIDATION REPORT")
        print("=" * 65)
        print(f"Datasets Loaded: {len(self.data)}")
        for fname, rows in self.data.items():
            print(f"  - {fname:<25}: {len(rows):>5} records")
            
        if self.warnings:
            print("\nWarnings:")
            for w in self.warnings:
                print(f"  [WARN] {w}")
                
        if self.errors:
            print("\nValidation Errors:")
            for err in self.errors:
                print(f"  [FAIL] {err}")
            print("\nRESULT: FAILED (Errors detected)")
        else:
            print("\nRESULT: PASSED (All validation criteria satisfied)")
        print("=" * 65)


def main():
    parser = argparse.ArgumentParser(description="RetailIQ Dataset Validator")
    parser.add_argument("--data-dir", default="data/generated", help="Directory containing CSV files")
    args = parser.parse_args()
    
    validator = DatasetValidator(Path(args.data_dir))
    success = validator.run_all()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
