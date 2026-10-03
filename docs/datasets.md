# RetailIQ Dataset Blueprint & Schemas

> Locked reference derived from [Product Specification](file:///c:/Users/shubh/Desktop/retailIQ/docs/product-spec.md).

For RetailIQ, all datasets must be internally consistent, relational, and linked through shared primary and foreign keys. This design ensures that a single customer interaction (such as an abandoned cart or return) can be traced across the entire retail supply chain.

---

## 1. Directory Structure

Data assets are managed within the following structure:

- `data/raw/`: Original or imported seed CSV files.
- `data/generated/`: Synthesized and calibrated datasets ready for ingestion.
- `data/schemas/`: JSON schemas, Pydantic models, and BigQuery table DDLs.

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

| Dataset | Key Columns | Description & Role |
|---|---|---|
| `customers.csv` | `customer_id` (PK), `age_group`, `location`, `preferred_category`, `preferred_brands`, `avg_order_value`, `price_range`, `loyalty_tier` | Master customer profile providing demographic context and baseline affinities. |
| `products.csv` | `product_id` (PK), `product_name`, `category`, `subcategory`, `brand`, `price`, `rating`, `attributes`, `description` | Master product catalog supporting retrieval, attribute matching, and substitution logic. |
| `search_events.csv` | `event_id` (PK), `customer_id` (FK), `query`, `timestamp` | Customer search intent logs, zero-result queries, and discovery patterns. |
| `browsing_events.csv` | `event_id` (PK), `customer_id` (FK), `product_id` (FK), `event_type`, `duration`, `timestamp` | Behavioral web/app clickstream, product view durations, and abandonment flags. |
| `cart_events.csv` | `event_id` (PK), `customer_id` (FK), `product_id` (FK), `action`, `quantity`, `timestamp` | Add-to-cart, remove-from-cart, and session drop-off telemetry. |
| `orders.csv` | `order_id` (PK), `customer_id` (FK), `product_id` (FK), `quantity`, `price`, `discount`, `order_date`, `channel` | Historical purchase transactions and operational sales demand. |
| `inventory.csv` | `product_id` (FK), `store_id` (FK), `stock`, `availability_time` | Stock positions across regional distribution hubs and physical stores. |
| `stores.csv` | `store_id` (PK), `location`, `format`, `region` | Store metadata, geographic regional grouping, and format type. |
| `promotions.csv` | `product_id` (FK), `campaign`, `discount`, `start_date`, `end_date`, `channel` | Active and historical discount campaigns for elasticity and margin analysis. |
| `reviews_returns.csv` | `customer_id` (FK), `product_id` (FK), `rating`, `review_text`, `return_flag`, `return_reason`, `date` | Voice-of-customer sentiment, defect signals, and return rate triggers. |

### 3.2 Strong Additions

| Dataset | Key Columns | Description & Role |
|---|---|---|
| `delivery_events.csv` | `order_id` (FK), `promised_date`, `actual_date`, `delay_days`, `status` | Delivery fulfillment telemetry to identify post-purchase fulfillment friction. |
| `support_conversations.csv` | `customer_id` (FK), `order_id` (FK), `issue_type`, `conversation_text`, `resolution`, `timestamp` | Transcripts and tags from customer service interactions. |

---

## 4. Integrity and Data Generation Rules

1. **Relational Referencing**: Any `customer_id` in `orders.csv` or event streams must exist in `customers.csv`.
2. **Product Referencing**: Any `product_id` across inventory, promotions, or orders must exist in `products.csv`.
3. **Temporal Consistency**: An order date must logically succeed or match corresponding browsing or cart event timestamps.
4. **Calculated Realism**: Discrepancies between prices in `products.csv` and `orders.csv` must align with active campaigns in `promotions.csv`.
