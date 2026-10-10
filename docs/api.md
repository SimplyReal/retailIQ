# RetailIQ API Specification & Intelligence Contracts

> Locked reference derived from [Product Specification](file:///c:/Users/shubh/Desktop/retailIQ/docs/product-spec.md).

RetailIQ exposes RESTful API endpoints powered by FastAPI. All investigation endpoints consume and produce domain-neutral models defined in [`backend/app/common/schemas.py`](file:///c:/Users/shubh/Desktop/retailIQ/backend/app/common/schemas.py).

---

## 1. General Principles

- **Base URL**: `/` for root health probes; `/api/v1` for versioned endpoints.
- **Data Format**: `application/json` for requests and responses.
- **Error Response Standard**:
  ```json
  {
    "detail": {
      "code": "ERROR_CODE_STRING",
      "message": "Human readable explanation",
      "context": {}
    }
  }
  ```

---

## 2. Shared Investigation Contracts

### 2.1 `InvestigationRequest`
Domain-neutral input triggering customer, retail, or cross-domain investigations.

```json
{
  "query": "Investigate why customer abandoned cart on running shoes",
  "customer_id": "CUST-0003",
  "product_id": "PROD-0004",
  "store_id": "STORE-001",
  "order_id": null,
  "domain": "cross_domain",
  "parameters": {
    "lookback_days": 14
  }
}
```

- **`query`**: Required non-empty natural-language search query, anomaly signal, or question.
- **`customer_id`**: Optional customer identifier context (`CUST-XXXX`).
- **`product_id`**: Optional product identifier context (`PROD-XXXX`).
- **`store_id`**: Optional store identifier context (`STORE-XXX`).
- **`order_id`**: Optional order transaction context (`ORD-XXXXX`).
- **`domain`**: Target domain enum (`"customer"`, `"retail"`, `"cross_domain"`, or `null`).
- **`parameters`**: Key-value map of configuration or filtering options.

### 2.2 `InvestigationResponse`
Domain-neutral output representing completed, in-progress, or escalated investigations.

```json
{
  "investigation_id": "INV-A1B2C3D4",
  "status": "completed",
  "request": {
    "query": "Investigate why customer abandoned cart on running shoes",
    "customer_id": "CUST-0003",
    "product_id": "PROD-0004",
    "store_id": "STORE-001",
    "order_id": null,
    "domain": "cross_domain",
    "parameters": {
      "lookback_days": 14
    }
  },
  "findings": [
    {
      "agent": "Lost Sale Investigation Agent",
      "finding": "Customer abandoned cart due to price sensitivity mismatch with zero active promotions.",
      "evidence": [
        {
          "type": "data_point",
          "label": "Customer Affinity",
          "value": {
            "tier": "Budget",
            "avg_order_value": 2400.0
          },
          "source": "customers.csv"
        },
        {
          "type": "event",
          "label": "Cart Action",
          "value": {
            "action": "abandon",
            "quantity": 1
          },
          "source": "cart_events.csv"
        }
      ],
      "confidence": 0.93,
      "recommendations": [
        {
          "action": "Recommend alternative PROD-0001 (₹3,499) with ₹350 discount",
          "rationale": "Matches customer running intent and price bracket",
          "expected_impact": "Recovers cart conversion",
          "priority": "HIGH",
          "confidence": 0.88
        }
      ],
      "sources": [
        "customers.csv",
        "cart_events.csv",
        "products.csv"
      ]
    }
  ],
  "summary": "Investigation confirmed price barrier for budget customer CUST-0003 on premium shoe PROD-0004.",
  "metadata": {
    "execution_time_ms": 38,
    "version": "0.1.0"
  },
  "timestamp": "2026-10-10T07:45:00Z"
}
```

- **`investigation_id`**: Unique string identifier (`INV-XXXXXXXX`).
- **`status`**: Processing lifecycle status (`"completed"`, `"pending"`, `"in_progress"`, `"failed"`).
- **`request`**: Embedded original `InvestigationRequest` object.
- **`findings`**: Collection of `AgentResult` objects.
- **`summary`**: Synthesized narrative across agent findings.
- **`metadata`**: Diagnostic metadata including execution latency and routing trace.
- **`timestamp`**: ISO 8601 UTC timestamp.

---

## 3. Foundation Endpoints (Current Scope)

### `GET /health`
Liveness and readiness probe for container orchestrators (Cloud Run, Docker).

- **Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-10T07:45:00Z"
  }
  ```

### `GET /api/v1/system`
System diagnostic and module readiness endpoint.

- **Response (200 OK)**:
  ```json
  {
    "name": "RetailIQ Backend",
    "version": "0.1.0",
    "environment": "development",
    "status": "ready",
    "modules": {
      "customer_intelligence": "initialized",
      "retail_intelligence": "initialized",
      "orchestrator": "initialized",
      "evidence_layer": "initialized"
    },
    "timestamp": "2026-10-10T07:45:00Z"
  }
  ```

---

## 4. Product Roadmap Endpoints (Targeted per Product Spec)

### 4.1 Customer Intelligence (`/api/v1/customer/`)
- `POST /api/v1/customer/context`: Compiles live customer profile context.
- `POST /api/v1/customer/discover`: Natural-language product discovery with match rationale.
- `POST /api/v1/customer/substitute`: Generates viable alternatives with trade-off explanations.
- `POST /api/v1/customer/friction`: Detects customer journey struggles and drop-offs.
- `POST /api/v1/customer/investigate-lost-sale`: Diagnoses checkout or cart abandonment.

### 4.2 Retail Intelligence Endpoints (`/api/v1/retail/`)

- `GET /api/v1/retail/overview`: Master aggregation endpoint returning dataset-grounded KPIs, prioritized anomaly signals, sales period analysis, multi-store inventory distribution, return metrics, and consolidated decision queues.
- `GET /api/v1/retail/kpis`: Top-level business KPIs for sales (revenue, order count, AOV), inventory (total units, stockouts), returns (rates and denominators), and promotions.
- `GET /api/v1/retail/signals`: Prioritized anomaly signals linked directly to dataset observations and pre-configured investigation queries.
- `GET /api/v1/retail/sales-investigation?product_id=PROD-0005`: Detailed period 1 (active promo) vs period 2 (post promo) volume and revenue comparisons.
- `GET /api/v1/retail/inventory-intelligence?product_id=PROD-0001`: Store-by-store stock breakdown, imbalance ratio calculation, and grounded inter-store transfer recommendations.
- `GET /api/v1/retail/return-intelligence`: Product-level return rates with explicit denominators (`returns / total_reviews`), average ratings, and sizing defect quotes.
- `GET /api/v1/retail/decision-queue`: Consolidated recommendations awaiting human operator approval in local simulation mode.
