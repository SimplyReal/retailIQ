# RetailIQ API Specification

> Locked reference derived from [Product Specification](file:///c:/Users/shubh/Desktop/retailIQ/docs/product-spec.md).

RetailIQ exposes a RESTful API powered by FastAPI.

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

## 2. Foundation Endpoints (Current Scope)

### `GET /health`
Liveness and readiness probe for container orchestrators (Cloud Run, Docker).

- **Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-03T14:55:00Z"
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
    "timestamp": "2026-10-03T14:55:00Z"
  }
  ```

---

## 3. Product Roadmap Endpoints (Targeted per Product Spec)

### 3.1 Customer Intelligence (`/api/v1/customer/`)
- `POST /api/v1/customer/context`: Retrieves or compiles dynamic customer profile context.
- `POST /api/v1/customer/discover`: Executes natural-language product retrieval with match rationale.
- `POST /api/v1/customer/substitute`: Generates viable alternatives with trade-off explanations.
- `POST /api/v1/customer/friction`: Analyzes customer journey telemetry for friction events.
- `POST /api/v1/customer/investigate-lost-sale`: Diagnoses checkout or cart abandonment.

### 3.2 Retail Intelligence (`/api/v1/retail/`)
- `GET /api/v1/retail/command-center`: Streams operational KPI anomalies and recommended investigation paths.
- `POST /api/v1/retail/investigate-sales`: Decomposes sales variance across dimensions.
- `POST /api/v1/retail/investigate-returns`: Evaluates return spikes and customer review themes.
- `POST /api/v1/retail/supply-demand`: Detects inventory imbalances and stockout risks.
- `POST /api/v1/retail/promotions/optimize`: Evaluates promotional lift vs. margin impact.
- `POST /api/v1/retail/actions/decision`: Captures human approval/rejection (`Approve`, `Reject`, `Investigate Further`).
