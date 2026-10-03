# RetailIQ Agent Specifications

> Locked reference derived from [Product Specification](file:///c:/Users/shubh/Desktop/retailIQ/docs/product-spec.md).

RetailIQ defines agents as modular intelligence services combining deterministic analytics (SQL/BigQuery), semantic retrieval (Vertex AI Search), and reasoning (Gemini).

---

## 1. Unified Agent Output Contract

Every agent in RetailIQ adheres to a standardized response contract. This ensures that frontend components, the orchestrator, and human audit logs render consistent evidence and actions.

```json
{
  "agent": "string",
  "finding": "string",
  "evidence": [
    {
      "type": "metric | data_point | retrieval | event",
      "label": "string",
      "value": "string | number | object",
      "source": "string"
    }
  ],
  "confidence": 0.85,
  "recommendations": [
    {
      "action": "string",
      "rationale": "string",
      "expected_impact": "string",
      "priority": "HIGH | MEDIUM | LOW"
    }
  ],
  "sources": [
    "string"
  ]
}
```

---

## 2. Customer Intelligence Agents

| Agent | Responsibility | Core Data Inputs | Primary Output |
|---|---|---|---|
| **Customer Context Agent** | Builds live customer context from demographic profiles, preferences, historical purchases, and recent events. | `customers.csv`, `orders.csv`, `browsing_events.csv` | Context object passed to downstream customer agents. |
| **Product Discovery Agent** | Translates natural-language customer intent into structured filters and ranks matching products with feature explanations. | `search_events.csv`, `products.csv`, customer context | Ranked product list with match criteria ("Why this product"). |
| **Smart Substitution Agent** | Identifies viable alternatives when an item is out of stock, unviable, or poorly rated, explicitly detailing trade-offs. | `products.csv`, `inventory.csv`, `reviews_returns.csv` | Ranked substitutions with attribute comparison and trade-off rationales. |
| **Customer Friction Agent** | Detects customer struggle across search failures, zero results, cart modifications, latency, delivery delays, and support chats. | `search_events.csv`, `cart_events.csv`, `delivery_events.csv`, `support_conversations.csv` | Identified friction points with severity score and root cause signals. |
| **Lost Sale Investigation Agent** | Diagnoses why a customer abandoned a purchase by correlating session behavior, price gaps, stock levels, delivery delays, and review sentiment. | `cart_events.csv`, `inventory.csv`, `promotions.csv`, `reviews_returns.csv`, `delivery_events.csv` | Root cause breakdown of abandoned intent and escalation trigger to business operations. |

---

## 3. Retail / Business Intelligence Agents

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

## 4. Implementation Guidelines

- **Reasoning vs. Computation**: LLM prompts must consume pre-calculated SQL aggregates and factual evidence. Calculations are never computed by the LLM.
- **Modularity**: Agents are exposed as Python modules and service functions behind the unified orchestrator.
- **Traceability**: All agent responses must populate `sources` and `evidence` fields for full auditability.
