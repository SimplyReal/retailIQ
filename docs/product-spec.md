# RetailIQ Product Specification

**AI Builder Cup 2026**

> An AI intelligence layer for the entire retail journey.

## 1. What We Are Building

RetailIQ is an investigation and decision layer, not just a chatbot or recommender.

It detects a meaningful signal, gathers context from multiple sources, investigates likely causes, shows evidence, explains the situation, and proposes an action for a human to approve.

### Core Loop

**Signal → Context → Investigation → Evidence → Explanation → Recommendation → Human Decision**

### Customer

- Smarter discovery
- Substitutions
- Friction detection
- Lost-sale investigation

### Business

- Sales intelligence
- Store intelligence
- Returns intelligence
- Supply-demand intelligence
- Promotion intelligence
- Pricing intelligence
- Assortment intelligence
- Next-best-action intelligence

---

# 2. Customer Intelligence Agents

| Agent | One-liner |
|---|---|
| **Product Discovery Agent** | Understands natural-language shopping intent and retrieves/ranks products that best match what the customer is actually trying to buy. |
| **Smart Substitution Agent** | Finds suitable alternatives when a product is unavailable, too expensive, poorly rated, or otherwise unsuitable, and explains trade-offs. |
| **Customer Friction Agent** | Detects moments of customer struggle across search, browsing, cart, checkout, delivery, support, and returns. |
| **Lost Sale Investigation Agent** | Investigates why a customer did not complete a purchase by correlating behavior, price, inventory, reviews, delivery, and promotion signals. |
| **Customer Context Agent** | Builds live context from profile, preferences, history, and recent activity so other agents reason with the right customer context. |

# 3. Retail / Business Intelligence Agents

| Agent | One-liner |
|---|---|
| **Sales Investigation Agent** | Explains why sales changed by decomposing performance across products, stores, channels, customers, time, price, and promotions. |
| **Store Performance Agent** | Identifies unusual store-level performance and explains the operational or commercial drivers behind the change. |
| **Return Intelligence Agent** | Finds return patterns and surfaces product, store, customer, or process signals behind them. |
| **Supply-Demand Intelligence Agent** | Detects stockouts, overstock, demand shifts, and supply-demand mismatches and explains business impact. |
| **Promotion Optimization Agent** | Evaluates promotion performance and distinguishes incremental demand from discount-driven margin erosion. |
| **Pricing & Markdown Agent** | Uses price, demand, inventory, and lifecycle signals to recommend evidence-backed pricing or markdown actions. |
| **Assortment Planning Agent** | Identifies products/categories to add, reduce, or rebalance using demand, profitability, availability, and customer signals. |
| **Next-Best-Action Agent** | Turns investigation findings into prioritized actions for a retailer, store, category, or product owner. |
| **Product Lifecycle Agent** | Tracks products from launch through decline and identifies lifecycle-specific actions. |
| **Retail Command Center Agent** | Monitors the operation for important anomalies and routes each issue to the appropriate specialist. |
| **Retail Memory Agent** | Maintains reusable context about prior investigations, decisions, outcomes, and recurring patterns. |
| **Scenario Analysis Agent** | Simulates what-if changes to price, promotion, inventory, or assortment before approval. |

---

# 4. Dataset Blueprint

For the competition, datasets can be synthetic but must be internally consistent.

The key requirement is that customer and business data share identifiers so one investigation can cross the retail journey.

| Dataset | Key fields | Main use |
|---|---|---|
| `customers.csv` | `customer_id`, `age_group`, `location`, `preferred_category`, `preferred_brands`, `avg_order_value`, `price_range`, `loyalty_tier` | Customer profile/context |
| `products.csv` | `product_id`, `product_name`, `category`, `subcategory`, `brand`, `price`, `rating`, `attributes`, `description` | Discovery, substitutions, analysis |
| `search_events.csv` | `event_id`, `customer_id`, `query`, `timestamp` | Search intent and failed discovery |
| `browsing_events.csv` | `event_id`, `customer_id`, `product_id`, `event_type`, `duration`, `timestamp` | Journey and engagement |
| `cart_events.csv` | `event_id`, `customer_id`, `product_id`, `action`, `quantity`, `timestamp` | Cart additions/removals/abandonment |
| `orders.csv` | `order_id`, `customer_id`, `product_id`, `quantity`, `price`, `discount`, `order_date`, `channel` | Purchases, revenue, demand |
| `reviews_returns.csv` | `customer_id`, `product_id`, `rating`, `review_text`, `return_flag`, `return_reason`, `date` | Voice-of-customer and returns |
| `inventory.csv` | `product_id`, `store_id/location`, `stock`, `availability_time` | Stockouts, overstock, availability |
| `stores.csv` | `store_id`, `location`, `format`, `region` | Store performance |
| `promotions.csv` | `product_id`, `campaign`, `discount`, `start_date`, `end_date`, `channel` | Promotion effectiveness |
| `delivery_events.csv` | `order_id`, `promised_date`, `actual_date`, `delay_days`, `status` | Delivery friction |
| `support_conversations.csv` | `customer_id`, `order_id`, `issue_type`, `conversation_text`, `resolution`, `timestamp` | Support friction |

### MVP Must-Have Datasets

- `customers`
- `products`
- `search_events`
- `browsing_events`
- `cart_events`
- `orders`
- `inventory`
- `promotions`
- `reviews_returns`
- `stores`

### Strong Additions

- `delivery_events`
- `support_conversations`

---

# 5. Architecture in Plain English

| Layer | Role |
|---|---|
| **UI** | Customer Intelligence + Retail Intelligence screens with shared investigation/evidence components. |
| **Cloud Run** | Customer/business APIs and orchestration endpoints. |
| **Orchestrator** | Chooses the relevant specialist components and assembles the investigation. |
| **BigQuery / BigQuery AI** | Deterministic analytics over events, transactions, inventory and business metrics. |
| **Vertex AI / Gemini** | Intent understanding, synthesis, explanation and recommendation reasoning. |
| **Vertex AI Search / Agent Search** | Retrieval over products, reviews, policies and business knowledge. |
| **Evidence Layer** | Facts, query results, retrieved sources and references supporting every important finding. |
| **Cloud SQL / AlloyDB** | Operational state, workflows, investigations and approvals. |
| **Cloud Storage** | Raw datasets, product assets and documents. |
| **Looker** | Deeper business analytics views. |

## Implementation Principle

Do not build every named agent as a separate LLM process.

In a 7-day build, several are focused reasoning modules/services that combine deterministic BigQuery queries, retrieval and Gemini only where reasoning adds value.

**Calculations stay in code/SQL; Gemini explains and synthesizes evidence.**

---

# 6. Seven-Day Task Plan

Both developers are full-stack AI engineers. Each owns a vertical slice, so both write frontend, backend, data, agent/reasoning logic, tests and Google Cloud integration.

## Day 1 — Foundation and Understanding

### Developer 1 — Customer Intelligence

- Map search → browse → cart → purchase/abandonment → review/return.
- Define customer schemas.
- Build customer UI shell.
- Validate Vertex AI/Search approach.
- Deliver customer architecture + seeded data + first screen.

### Developer 2 — Retail Intelligence

- Map sales → inventory → promotion → returns → action.
- Define business schemas.
- Build business UI shell.
- Validate BigQuery/BigQuery AI approach.
- Deliver business architecture + seeded data + first screen.

## Day 2 — Data + First Working Intelligence

### Developer 1 — Customer Intelligence

- Load customer-side tables to BigQuery.
- Build Customer Context.
- Implement Product Discovery retrieval with Vertex AI Search/Agent Search + Gemini.
- Build product cards and evidence panel.

### Developer 2 — Retail Intelligence

- Load business-side tables to BigQuery.
- Build Retail Command Center.
- Implement Sales Investigation queries and UI evidence panel.

## Day 3 — Investigation Agents

### Developer 1 — Customer Intelligence

Implement Customer Friction and Lost Sale Investigation using:

- journey
- price
- stock
- reviews
- delivery
- promotion signals

Use shared finding/evidence/confidence/recommendations/sources output.

### Developer 2 — Retail Intelligence

Implement Supply-Demand and Return Intelligence using:

- inventory
- orders
- products
- stores
- ratings
- return reasons

Use the same shared agent contract.

## Day 4 — Recommendations

### Developer 1 — Customer Intelligence

- Implement Smart Substitution with price/category/attribute/rating/availability constraints.
- Improve discovery with customer context.
- Add explanation/trade-off UI.
- Add low-confidence handling.

### Developer 2 — Retail Intelligence

- Implement Promotion Optimization and Next-Best-Action.
- Add recommendation UI with:
  - action
  - rationale
  - expected effect
  - confidence
  - evidence

## Day 5 — Cross-Domain Integration

### Developer 1 — Customer Intelligence

- Put customer agents behind the shared orchestrator.
- Add evidence/source references.
- Wire `customer_id`, `product_id`, `store_id`, `order_id`.
- Trigger a business investigation from an abandoned cart/lost-sale case.

### Developer 2 — Retail Intelligence

- Put business agents behind the shared orchestrator.
- Add analytical evidence references.
- Use the same shared IDs.
- Feed inventory/promotion/price/sales context back into customer outcome explanations.

## Day 6 — Productization

### Developer 1 — Customer Intelligence

- Polish customer dashboard and discovery flow.
- Add loading/error/empty states.
- Add evidence, confidence and feedback controls.
- Test search, substitution, friction, abandonment, and no-match scenarios.
- Optimize latency.

### Developer 2 — Retail Intelligence

- Polish Retail Command Center and investigation flow.
- Add loading/error/empty states.
- Add evidence, confidence and approval controls.
- Test sales anomaly, stockout, returns, promotion and recommendation scenarios.
- Optimize query cost/latency.

## Day 7 — Demo + Hardening

### Developer 1 — Customer Intelligence

- Run full customer-to-business scenarios.
- Fix defects.
- Prepare 2–3 customer investigation stories.
- Document customer APIs, agents, datasets and setup.

### Developer 2 — Retail Intelligence

- Run full business-to-customer scenarios.
- Fix defects.
- Prepare 2–3 business investigation stories.
- Document business APIs, agents, datasets and setup.

---

# 7. Definition of Done

### Customer Path

**Natural-language request → relevant products → match explanation → substitutions when needed → friction/lost-sale explanation with evidence.**

### Business Path

**Retailer asks why a KPI changed → analytical evidence → likely drivers → prioritized next-best action.**

### Cross-Domain Path

**An abandoned cart/lost sale can trigger a business investigation using product, inventory, promotion, sales and review data.**

### Engineering Path

Both developers can:

- run their domain
- deploy Cloud Run services
- use shared schemas/interfaces
- test the integrated flow

---

# 8. Shared GitHub Rules

Use the existing repository.

Suggested branches:

```text
dev1/customer-discovery
dev2/sales-investigation
```

Every agent returns:

```text
agent
finding
evidence
confidence
recommendations
sources
```

Gemini must not invent evidence.

Merge through pull requests with cross-review.

**Every day ends with a runnable increment.**

---

# 9. Recommended 7-Day MVP Scope

### Developer 1

- Customer Context
- Product Discovery
- Customer Friction
- Lost Sale Investigation
- Smart Substitution

### Developer 2

- Retail Command Center
- Sales Investigation
- Supply-Demand Intelligence
- Return Intelligence
- Next-Best-Action

### Shared

- Orchestrator
- Evidence Layer
- Shared schemas
- Cross-domain investigation
- Deployment
- Demo

---

# 10. Product Principles

These principles should guide implementation decisions:

1. RetailIQ is an **investigation and decision layer**, not merely a chatbot.
2. Every meaningful finding should be backed by evidence.
3. **Calculations stay in code/SQL.**
4. **Gemini reasons over evidence; it does not manufacture facts.**
5. Customer and business data must be connected through shared identifiers.
6. Named agents do not need to be separate LLM processes.
7. The system should support human approval/decision-making.
8. Every day should end with a runnable increment.
9. Prefer a smaller working vertical slice over many incomplete agents.
10. The cross-domain customer → business investigation is a core differentiator.

---

## Current Starting State

The repository currently begins with an existing `README.md`.

The README may be outdated. This specification is the product reference for implementation.

The first engineering milestone is:

**Repository → Frontend → Backend → Local health check → Google Cloud connectivity → Data → First vertical slice.**
