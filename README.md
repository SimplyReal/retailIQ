# retailIQ

> **An AI intelligence layer for the entire retail journey.**

RetailIQ is a multi-agent AI platform designed to connect **customer behavior, retail operations, business intelligence, and decision-making** into one intelligent system.

Instead of simply recommending products or answering questions, RetailIQ follows an investigation-driven approach:

**Signal → Context → Investigation → Evidence → Explanation → Recommendation → Human Decision**

---

## What is retailIQ?

RetailIQ serves two sides of the retail ecosystem:

### Customer Intelligence

retailIQ helps customers:

* Discover products using natural-language intent
* Find intelligent product substitutions
* Detect customer friction
* Understand cart abandonment and lost-sale situations
* Personalize experiences using customer context

### Retail / Business Intelligence

RetailIQ helps retailers:

* Investigate sales changes
* Understand store performance
* Detect stockouts and overstock
* Investigate product returns
* Analyze promotion effectiveness
* Support pricing and markdown decisions
* Improve assortment planning
* Recommend next-best actions
* Run business scenarios
* Maintain institutional retail memory

The goal is not just to answer:

> **"What happened?"**

but also:

> **"Why did it happen, what evidence supports that explanation, and what should we consider doing next?"**

---

# Core Architecture

```text
                         ┌─────────────────────┐
                         │     RetailIQ UI     │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
          Customer Intelligence            Retail Intelligence
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                              Cloud Run APIs
                                    │
                              ┌─────▼─────┐
                              │Orchestrator│
                              └─────┬─────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
       Customer Agents                            Business Agents
              │                                           │
              └─────────────────────┬─────────────────────┘
                                    │
                          Investigation Engine
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
         BigQuery              Vertex AI              Vertex AI
       / BigQuery AI            / Gemini             Search / Agent
             │                      │                    Search
             └──────────────────────┼──────────────────────┘
                                    │
                              Evidence Layer
                                    │
                              Recommendation
                                    │
                              Human Approval
```

---

# Agents

## Customer Intelligence Agents

| Agent                             | Responsibility                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Product Discovery Agent**       | Understands natural-language shopping intent and retrieves/ranks relevant products.                 |
| **Smart Substitution Agent**      | Finds suitable alternatives when a product is unavailable, expensive, poorly rated, or unsuitable.  |
| **Customer Friction Agent**       | Detects customer struggles across search, browsing, cart, checkout, delivery, support, and returns. |
| **Lost Sale Investigation Agent** | Investigates why a customer did not complete a purchase using behavioral and business signals.      |
| **Customer Context Agent**        | Builds live customer context from profile, preferences, history, and recent activity.               |

---

## Retail / Business Intelligence Agents

| Agent                                | Responsibility                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Sales Investigation Agent**        | Explains why sales changed across products, stores, channels, customers, time, price, and promotions. |
| **Store Performance Agent**          | Identifies unusual store performance and investigates the underlying drivers.                         |
| **Return Intelligence Agent**        | Finds return patterns and surfaces likely product, store, customer, or process causes.                |
| **Supply-Demand Intelligence Agent** | Detects stockouts, overstock, demand shifts, and supply-demand mismatches.                            |
| **Promotion Optimization Agent**     | Evaluates promotion effectiveness and identifies potential incremental demand versus discount impact. |
| **Pricing & Markdown Agent**         | Uses price, demand, inventory, and lifecycle signals to support pricing or markdown actions.          |
| **Assortment Planning Agent**        | Identifies products/categories to add, reduce, or rebalance.                                          |
| **Next-Best-Action Agent**           | Converts investigation findings into prioritized business actions.                                    |
| **Product Lifecycle Agent**          | Tracks products from launch through decline and identifies lifecycle-specific actions.                |
| **Retail Command Center Agent**      | Monitors important retail signals and routes issues to specialist agents.                             |
| **Retail Memory Agent**              | Maintains reusable context from previous investigations, decisions, and outcomes.                     |
| **Scenario Analysis Agent**          | Simulates what-if changes to price, promotion, inventory, or assortment.                              |

---

# Datasets

RetailIQ can use synthetic datasets for the competition.

The datasets should be internally consistent and connected through shared IDs.

| Dataset                     | Important Fields                                                                                                     | Purpose                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `customers.csv`             | `customer_id`, age_group, location, preferred_category, preferred_brands, avg_order_value, price_range, loyalty_tier | Customer context              |
| `products.csv`              | `product_id`, product_name, category, subcategory, brand, price, rating, attributes, description                     | Product intelligence          |
| `search_events.csv`         | `event_id`, `customer_id`, query, timestamp                                                                          | Search intent                 |
| `browsing_events.csv`       | `event_id`, `customer_id`, `product_id`, event_type, duration, timestamp                                             | Customer journey              |
| `cart_events.csv`           | `event_id`, `customer_id`, `product_id`, action, quantity, timestamp                                                 | Cart behavior                 |
| `orders.csv`                | `order_id`, `customer_id`, `product_id`, quantity, price, discount, order_date, channel                              | Purchases and sales           |
| `reviews_returns.csv`       | `customer_id`, `product_id`, rating, review_text, return_flag, return_reason, date                                   | Reviews and returns           |
| `inventory.csv`             | `product_id`, `store_id`, stock, availability_time                                                                   | Inventory intelligence        |
| `stores.csv`                | `store_id`, location, format, region                                                                                 | Store intelligence            |
| `promotions.csv`            | `product_id`, campaign, discount, start_date, end_date, channel                                                      | Promotion intelligence        |
| `delivery_events.csv`       | `order_id`, promised_date, actual_date, delay_days, status                                                           | Delivery friction             |
| `support_conversations.csv` | `customer_id`, `order_id`, issue_type, conversation_text, resolution, timestamp                                      | Customer support intelligence |



---

# Google Cloud Stack

RetailIQ is designed around Google Cloud services.

| Technology                          | Usage                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------ |
| **Gemini on Vertex AI**             | Reasoning, intent understanding, explanation, synthesis, recommendations |
| **Vertex AI Search / Agent Search** | Product and knowledge retrieval                                          |
| **BigQuery**                        | Customer, transaction, inventory, sales, and event analytics             |
| **BigQuery AI**                     | AI-assisted analytical workflows                                         |
| **Cloud Run**                       | APIs, orchestrator, agent services                                       |
| **Cloud Storage**                   | Datasets, product assets, documents                                      |
| **Cloud SQL / AlloyDB**             | Application state and investigation workflows                            |
| **Looker**                          | Business analytics and dashboards                                        |


---


# 🗂️ Repository Structure

```text
retailiq/
│
├── frontend/
│   ├── customer/
│   ├── business/
│   ├── shared/
│   └── components/
│
├── backend/
│   ├── customer/
│   ├── business/
│   ├── agents/
│   ├── api/
│   └── shared/
│
├── data/
│   ├── customer/
│   ├── business/
│   └── schemas/
│
├── infrastructure/
│   ├── cloud-run/
│   ├── bigquery/
│   ├── storage/
│   └── vertex-ai/
│
├── tests/
│
├── docs/
│
├── .env.example
├── README.md
└── requirements.txt
```

---

# Demo Scenario

The strongest demo should connect the customer and business sides.

### 1. Customer Search

Customer asks:

> **"Find black running shoes under ₹4,000."**

RetailIQ understands:

```text
Category: Running Shoes
Color: Black
Maximum price: ₹4,000
```

---

### 2. Product Discovery

The Product Discovery Agent retrieves suitable products.

The UI explains:

```text
Why this product?

✓ Under budget
✓ Black
✓ Running category
✓ Preferred brand
✓ Good rating
```

---

### 3. Customer Abandons Cart

Customer:

```text
Views product
↓
Adds to cart
↓
Doesn't purchase
```

RetailIQ detects a potential lost sale.

---

### 4. Investigation

The Lost Sale Investigation Agent investigates:

```text
Customer behavior
+
Product
+
Inventory
+
Price
+
Promotion
+
Reviews
+
Delivery
+
Historical sales
```

---

### 5. Evidence

RetailIQ might surface:

```text
Customer viewed the product twice.

Inventory was low at the preferred location.

No active promotion was available.

Similar products had better review sentiment.
```

---

### 6. Business Intelligence

RetailIQ sends the case into the business side.

The retailer sees:

```text
Potential Lost Sale

Likely contributing factors:
1. Local availability
2. Offer competitiveness
3. Product review perception

Evidence:
...
```

---

### 7. Recommendation

The Next-Best-Action Agent proposes an action.

```text
Recommended Action

Investigate local inventory availability
and evaluate whether a targeted offer
or alternative product placement is appropriate.

Confidence: 82%
```

The retailer can:

```text
[ Approve ]

[ Reject ]

[ Investigate Further ]
```

---


# Why RetailIQ?

Traditional retail AI often focuses on one isolated capability:

```text
Recommendation
Chatbot
Dashboard
Forecast
Search
```

RetailIQ connects these capabilities into an **investigation loop**.

```text
Customer Signal
      ↓
Context
      ↓
Investigation
      ↓
Business Evidence
      ↓
Explanation
      ↓
Recommendation
      ↓
Human Decision
```

This allows the same intelligence layer to understand both:

> **"What is the customer experiencing?"**

and

> **"What is happening inside the business?"**

while connecting the two.

---

Built for:

**AI Builder Cup 2026 — Retail & Commerce: Intelligent Customer and Business Experiences**
