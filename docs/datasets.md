# RetailIQ Dataset Blueprint & Schemas

> Locked reference derived from [Product Specification](file:///c:/Users/shubh/Desktop/retailIQ/docs/product-spec.md).

For RetailIQ, all datasets are internally consistent, relational, and linked through shared primary and foreign keys. This design ensures that a single customer interaction (such as an abandoned cart, out-of-stock event, or return) can be traced across the entire retail supply chain.

---

## 1. Directory Structure

Data assets are managed within the following structure:

- `data/raw/`: Original or imported seed CSV files.
- `data/generated/`: Synthesized and calibrated datasets ready for ingestion.
- `data/schemas/`: Machine-readable JSON Schemas (`*.schema.json`) and Pydantic V2 models (`models.py`).

---

## 2. Shared Key Relationships

```text
    ┌───────────────┐               ┌───────────────┐
    │   customers   │               │    stores     │
    └───────┬───────┘               └───────┬───────┘
            │ customer_id                   │ store_id
            │                               │
            ├──────────────────────┐        │
            │                      │        │
            ▼                      ▼        ▼
┌──────────────────────┐        ┌───────────────────────┐
│ search/browse/cart   │        │       inventory       │
│      events          │        └───────────┬───────────┘
└───────────┬──────────┘                    │ product_id
            │                               │
            ├──────────────┐                │
            │              │                │
            ▼              ▼                ▼
┌──────────────────────┐ ┌──────────────────────────────┐
│  reviews & returns   │ │          products            │
└───────────┬──────────┘ └──────────────┬───────────────┘
            │                           │ product_id
            ▼                           ▼
┌───────────────────────────────────────────────────────┐
│                       orders                          │
└───────────────────────────────────────────────────────┘
```

---

## 3. Dataset Specifications

### 3.1 MVP Core Datasets

| Dataset | Primary Key | Foreign Keys | Schema File | Description & Core Fields |
|---|---|---|---|---|
| `customers.csv` | `customer_id` | — | `customers.schema.json` | Demographic profile and affinities: `customer_id`, `age_group`, `location`, `preferred_category`, `preferred_brands`, `avg_order_value`, `price_range`, `loyalty_tier`. |
| `products.csv` | `product_id` | — | `products.schema.json` | Master catalog: `product_id`, `product_name`, `category`, `subcategory`, `brand`, `price`, `rating`, `attributes`, `description`. |
| `search_events.csv` | `event_id` | `customer_id` | `search_events.schema.json` | Intent search telemetry: `event_id`, `customer_id`, `query`, `timestamp`. |
| `browsing_events.csv` | `event_id` | `customer_id`, `product_id` | `browsing_events.schema.json` | Clickstream telemetry: `event_id`, `customer_id`, `product_id`, `event_type`, `duration`, `timestamp`. |
| `cart_events.csv` | `event_id` | `customer_id`, `product_id` | `cart_events.schema.json` | Add/remove/abandon actions: `event_id`, `customer_id`, `product_id`, `action`, `quantity`, `timestamp`. |
| `orders.csv` | `order_id` | `customer_id`, `product_id` | `orders.schema.json` | Purchase transactions: `order_id`, `customer_id`, `product_id`, `quantity`, `price`, `discount`, `order_date`, `channel`. |
| `inventory.csv` | (`product_id`, `store_id`) | `product_id`, `store_id` | `inventory.schema.json` | Store on-hand stock and SLA: `product_id`, `store_id`, `stock`, `availability_time`. |
| `stores.csv` | `store_id` | — | `stores.schema.json` | Store metadata: `store_id`, `location`, `format`, `region`. |
| `promotions.csv` | — | `product_id` | `promotions.schema.json` | Promotional discount campaigns: `product_id`, `campaign`, `discount`, `start_date`, `end_date`, `channel`. |
| `reviews_returns.csv` | — | `customer_id`, `product_id` | `reviews_returns.schema.json` | Reviews and returns: `customer_id`, `product_id`, `rating`, `review_text`, `return_flag`, `return_reason`, `date`. |

### 3.2 Optional / Extended Datasets

| Dataset | Primary Key | Foreign Keys | Schema File | Role |
|---|---|---|---|---|
| `delivery_events.csv` | `order_id` | `order_id` | `delivery_events.schema.json` | Delivery fulfillment telemetry: `order_id`, `promised_date`, `actual_date`, `delay_days`, `status`. |
| `support_conversations.csv` | — | `customer_id`, `order_id` (nullable) | `support_conversations.schema.json` | Customer support transcripts: `customer_id`, `order_id`, `issue_type`, `conversation_text`, `resolution`, `timestamp`. |

---

## 4. Intentionally Seeded Scenarios

The synthetic generator includes realistic scenarios calibrated for downstream agent investigations:

1. **Price-Related Cart Abandonment**:
   - Customer `CUST-0003` (Budget affinity, average order value ~₹2,400) adds premium racing shoes `PROD-0004` (price ₹6,499) with no active discount.
   - Result: Abandonment recorded in `cart_events.csv`; no order placed. Demonstrates price-mismatch friction.
2. **Unavailable Sizes / Stockout**:
   - Customer `CUST-0002` searches for size UK 9 trail shoes (`PROD-0002`).
   - In customer's local flagship store (`STORE-001`), stock is 0 (`out_of_stock`).
   - Result: Cart abandonment; triggers Smart Substitution Agent.
3. **Sales Decline Across Periods**:
   - Product `PROD-0005` ("AeroTech Seamless Tee") has active promotion ("MonsoonClearanceEarly", discount ₹400) during Sep 1–15, generating 9 orders.
   - Promotion ends Sep 15. In Period 2 (Sep 16–30), orders plunge to 2 orders.
   - Demonstrates promotion-driven demand cliff for Sales Investigation Agent.
4. **Cross-Store Stock Imbalance**:
   - Product `PROD-0001` ("AeroStride Velocity Marathon Runner") is in critical deficit in Mumbai Flagship (`STORE-001`, stock: 2).
   - Concurrently, suburban outlet (`STORE-004`, Ahmedabad) holds an excess inventory of 85 units with low sales velocity.
   - Provides clear evidence for Supply-Demand Intelligence Agent to propose inter-store inventory transfer.
5. **High Product Returns & Sizing Defect**:
   - Product `PROD-0006` ("StormShield Packable Jacket") exhibits an ~80% return rate.
   - Review records explicitly cite `return_reason: sizing_issue` with 1- and 2-star ratings complaining that dimensions run 2 sizes too small.
   - Demonstrates root cause evidence for Return Intelligence Agent.

---

## 5. Commands to Generate and Validate Data

### 5.1 Generate Synthetic Data

Execute using the project virtual environment:

```powershell
# Small development dataset (Default: 25 customers, 15 products, 5 stores)
.\.venv\Scripts\python.exe scripts/generate_data.py --scale small --seed 42

# Large dataset (300 customers, 100 products, 15 stores, scaled events)
.\.venv\Scripts\python.exe scripts/generate_data.py --scale large --seed 42

# Custom output directory
.\.venv\Scripts\python.exe scripts/generate_data.py --scale small --output-dir data/generated
```

### 5.2 Validate Data Integrity

Run the automated validator to check primary keys, foreign keys, numerical ranges, timestamps, and seeded scenarios:

```powershell
.\.venv\Scripts\python.exe scripts/validate_datasets.py --data-dir data/generated
```

### 5.3 Run Automated Tests

Execute the full local pytest test suite (no Google Cloud credentials required):

```powershell
.\.venv\Scripts\python.exe -m pytest tests -v
```
