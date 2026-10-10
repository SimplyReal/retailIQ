# RetailIQ Agent Specifications & Intelligence Contracts

> Locked reference derived from [Product Specification](file:///c:/Users/shubh/Desktop/retailIQ/docs/product-spec.md).

RetailIQ defines agents as modular intelligence services combining deterministic analytics (SQL/BigQuery), semantic retrieval (Vertex AI Search), and reasoning (Gemini).

All agents share a domain-neutral intelligence contract implemented in [`backend/app/common/schemas.py`](file:///c:/Users/shubh/Desktop/retailIQ/backend/app/common/schemas.py).

---

## 1. Shared Intelligence Contracts

### 1.1 `Evidence` Model
Every fact, data point, or retrieved document backing an agent finding must be encapsulated as an `Evidence` item:

```json
{
  "type": "metric",
  "label": "Period 1 vs Period 2 Order Count",
  "value": {
    "prior_period": 9,
    "current_period": 2
  },
  "source": "orders.csv"
}
```

- **`type`**: Required enum (`"metric"`, `"data_point"`, `"retrieval"`, `"event"`).
- **`label`**: Human-readable label (non-empty string).
- **`value`**: Value payload (`number`, `string`, `dict`, `list`).
- **`source`**: Originating dataset, table, or index reference (non-empty string).

### 1.2 `Recommendation` Model
Evidence-backed actions formulated for operator review and decision:

```json
{
  "action": "Trigger inter-store inventory transfer of 30 units from STORE-004 to STORE-001",
  "rationale": "High sales velocity in STORE-001 created stockout risk while STORE-004 holds excess aging stock",
  "expected_impact": "Prevent ₹1,05,000 estimated weekly lost sales",
  "priority": "HIGH",
  "confidence": 0.89
}
```

- **`action`**: Concise action title (non-empty string).
- **`rationale`**: Justification based on evidence (non-empty string).
- **`expected_impact`**: Projected operational or commercial outcome (non-empty string).
- **`priority`**: Urgency rating (`"HIGH"`, `"MEDIUM"`, `"LOW"`).
- **`confidence`**: Optional recommendation confidence score between `0.0` and `1.0`.

### 1.3 `AgentResult` Model
Standard output format returned by all customer and retail agents:

```json
{
  "agent": "Supply-Demand Intelligence Agent",
  "finding": "Localized stockout at STORE-001 with severe cross-store imbalance relative to STORE-004.",
  "evidence": [
    {
      "type": "data_point",
      "label": "STORE-001 Stock Balance",
      "value": 2,
      "source": "inventory.csv"
    },
    {
      "type": "data_point",
      "label": "STORE-004 Stock Balance",
      "value": 85,
      "source": "inventory.csv"
    }
  ],
  "confidence": 0.91,
  "recommendations": [
    {
      "action": "Rebalance 30 units from STORE-004 to STORE-001",
      "rationale": "STORE-001 stock reaches depletion within 24 hours under current velocity",
      "expected_impact": "Eliminate stockout loss",
      "priority": "HIGH"
    }
  ],
  "sources": [
    "inventory.csv",
    "orders.csv"
  ]
}
```

- **`agent`**: Agent name (non-empty string).
- **`finding`**: Synthesized finding summary (non-empty string).
- **`evidence`**: List of structured `Evidence` objects.
- **`confidence`**: Float constrained between `0.0` and `1.0` inclusive.
- **`recommendations`**: List of structured `Recommendation` objects.
- **`sources`**: List of non-empty source strings referenced.

---

## 2. Representative Domain Examples

### 2.1 Customer Intelligence Example (Lost Sale Investigation)

```json
{
  "agent": "Lost Sale Investigation Agent",
  "finding": "Customer CUST-0003 abandoned cart on PROD-0004 due to price sensitivity mismatch (product price is 2.7x average order value) with no active promotional discount.",
  "evidence": [
    {
      "type": "data_point",
      "label": "Customer Price Sensitivity",
      "value": {
        "tier": "Budget",
        "avg_order_value": 2400.0
      },
      "source": "customers.csv"
    },
    {
      "type": "data_point",
      "label": "Cart Item Price",
      "value": 6499.0,
      "source": "products.csv"
    },
    {
      "type": "event",
      "label": "Cart Action Telemetry",
      "value": {
        "action": "abandon",
        "duration_seconds": 185
      },
      "source": "cart_events.csv"
    }
  ],
  "confidence": 0.93,
  "recommendations": [
    {
      "action": "Present alternative recommendation PROD-0001 (₹3,499) with active ₹350 promotion",
      "rationale": "Matches road running intent while fitting within customer's budget range",
      "expected_impact": "Recovers cart conversion opportunity",
      "priority": "HIGH"
    }
  ],
  "sources": [
    "customers.csv",
    "products.csv",
    "cart_events.csv",
    "promotions.csv"
  ]
}
```

### 2.2 Retail Intelligence Example (Return Intelligence)

```json
{
  "agent": "Return Intelligence Agent",
  "finding": "Product PROD-0006 exhibits an anomalous 80% return rate driven by severe sizing defects across customer reviews.",
  "evidence": [
    {
      "type": "metric",
      "label": "Product Return Rate",
      "value": "80%",
      "source": "reviews_returns.csv"
    },
    {
      "type": "retrieval",
      "label": "Extracted Review Snippets",
      "value": [
        "Runs at least two sizes smaller than labeled",
        "Chest and arm dimensions are way too tight"
      ],
      "source": "reviews_returns.csv"
    }
  ],
  "confidence": 0.95,
  "recommendations": [
    {
      "action": "Update product sizing guide banner with 'Runs 2 sizes small' advisory",
      "rationale": "Customers ordering normal size consistently report inability to wear item",
      "expected_impact": "Estimated 60% reduction in return processing overhead",
      "priority": "HIGH"
    }
  ],
  "sources": [
    "reviews_returns.csv",
    "orders.csv"
  ]
}
```

---

## 3. Customer Intelligence Agents

| Agent | Responsibility | Core Data Inputs | Primary Output |
|---|---|---|---|
| **Customer Context Agent** | Builds live customer context from demographic profiles, preferences, historical purchases, and recent events. | `customers.csv`, `orders.csv`, `browsing_events.csv` | Context object passed to downstream customer agents. |
| **Product Discovery Agent** | Translates natural-language customer intent into structured filters and ranks matching products with feature explanations. | `search_events.csv`, `products.csv`, customer context | Ranked product list with match criteria ("Why this product"). |
| **Smart Substitution Agent** | Identifies viable alternatives when an item is out of stock, unviable, or poorly rated, explicitly detailing trade-offs. | `products.csv`, `inventory.csv`, `reviews_returns.csv` | Ranked substitutions with attribute comparison and trade-off rationales. |
| **Customer Friction Agent** | Detects customer struggle across search failures, zero results, cart modifications, latency, delivery delays, and support chats. | `search_events.csv`, `cart_events.csv`, `delivery_events.csv`, `support_conversations.csv` | Identified friction points with severity score and root cause signals. |
| **Lost Sale Investigation Agent** | Diagnoses why a customer abandoned a purchase by correlating session behavior, price gaps, stock levels, delivery delays, and review sentiment. | `cart_events.csv`, `inventory.csv`, `promotions.csv`, `reviews_returns.csv`, `delivery_events.csv` | Root cause breakdown of abandoned intent and escalation trigger to business operations. |

---

## 4. Retail / Business Intelligence Agents

| Agent | Responsibility | Core Data Inputs | Primary Output |
|---|---|---|---|
| **Retail Command Center Agent** | High-level sentinel monitoring operational KPIs, detecting anomalies across stores/categories, and dispatching specialist investigations. | Aggregated KPI tables, alerts stream | Operational anomaly feed with recommended routing. |
| **Sales Investigation Agent** | Decomposes sales trends and variances across products, stores, customer segments, channels, pricing, and promotions. | `orders.csv`, `products.csv`, `stores.csv`, `promotions.csv` | Variance decomposition, contributing drivers, and verified evidence. |
| **Store Performance Agent** | Investigates store-level outlier performance (footfall, sales, fulfillment delays) and highlights operational causes. | `stores.csv`, `orders.csv`, `inventory.csv` | Store diagnostics, peer store benchmarks, and local drivers. |
| **Supply-Demand Intelligence Agent** | Detects inventory mismatches, imminent stockouts, overstock build-ups, and demand velocity shifts. | `inventory.csv`, `orders.csv`, `products.csv` | Stock balance alerts, reorder recommendations, and holding cost impact. |
| **Return Intelligence Agent** | Analyzes return frequency and feedback text to uncover product defects, sizing discrepancies, or transit damage. | `reviews_returns.csv`, `products.csv`, `orders.csv` | Return rate anomalies, customer sentiment themes, and quality flags. |
| **Promotion Optimization Agent** | Evaluates promotional uplift versus margin loss, distinguishing genuine incremental demand from discount subsidization. | `promotions.csv`, `orders.csv`, `products.csv` | Promotion ROI, cannibalization metrics, and discount guidance. |
| **Pricing & Markdown Agent** | Evaluates competitive price points, inventory aging, and elasticity signals to recommend evidence-based pricing or markdown schedules. | `orders.csv`, `products.csv`, `inventory.csv` | Markdown schedule recommendations with margin impact models. |
| **Assortment Planning Agent** | Recommends catalog additions, discontinuations, or rebalances based on margin velocity, category coverage, and demand trends. | `products.csv`, `orders.csv`, `search_events.csv` | Assortment rebalance proposals and gap analysis. |
| **Next-Best-Action Agent** | Synthesizes findings from across active investigations into concrete, prioritized business actions for human operator approval. | Investigation findings, business policies | Prioritized action queue with approval actions (`Approve`, `Reject`, `Escalate`). |
| **Product Lifecycle Agent** | Monitors product maturity from launch through growth, plateau, and decline to guide appropriate lifecycle interventions. | `products.csv`, `orders.csv` | Product lifecycle phase classification and lifecycle actions. |
| **Retail Memory Agent** | Retains structured records of past investigations, actions taken, and measured outcomes to prevent repetitive errors and build organizational context. | Historical investigation logs, decision audit logs | Relevant precedent cases and historical outcome metrics. |
| **Scenario Analysis Agent** | Simulates what-if scenarios (e.g., price reduction vs. targeted bundle, inventory reallocation) before human operator approval. | Historical elasticities, inventory status | Comparative scenario projections with trade-off matrices. |

---

## 5. Domain Neutrality & Governance Rules

1. **Universal Format**: Customer Intelligence and Retail Intelligence agents share the exact same `AgentResult` format.
2. **Deterministic Backing**: Calculations stay in SQL/code. The `evidence` field supplies the verified mathematical and data backing.
3. **Traceability**: Findings must list originating `sources` (table or index names) and verifiable evidence items.
4. **Human Review**: Every recommendation specifies priority (`HIGH`, `MEDIUM`, `LOW`) and actionable rationale for operator sign-off.
