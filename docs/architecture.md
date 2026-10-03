# RetailIQ System Architecture

> Locked reference derived from [Product Specification](file:///c:/Users/shubh/Desktop/retailIQ/docs/product-spec.md).

RetailIQ is an investigation and decision layer connecting customer behavior, retail operations, and business intelligence. Rather than operating as an isolated chatbot or pure recommender, RetailIQ operates on a structured investigation loop.

---

## 1. Core Investigation Loop

Every investigation follows a strict decision sequence:

```text
[Signal] 
   └── Detected anomaly, failed search, friction event, or metric drop
[Context]
   └── Live customer profile, store status, catalog attributes, inventory levels
[Investigation]
   └── Decomposed analytical queries across transaction, event, and operational logs
[Evidence]
   └── Deterministic data points, BigQuery facts, and retrieved source snippets
[Explanation]
   └── Synthesized natural-language narrative explaining root causes
[Recommendation]
   └── Prioritized, actionable next-best-action with confidence metrics
[Human Decision]
   └── Interactive operator approval, rejection, or escalation workflow
```

---

## 2. High-Level Architecture Diagram

```text
                               ┌────────────────────────────────────────┐
                               │           RetailIQ Web UI              │
                               │        (Next.js + TypeScript)          │
                               └───────────────────┬────────────────────┘
                                                   │ HTTPS / REST
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │            Backend Service             │
                               │          (FastAPI on Cloud Run)        │
                               └───────────────────┬────────────────────┘
                                                   │
                                                   ▼
                               ┌────────────────────────────────────────┐
                               │         Unified Orchestrator           │
                               │   Routes requests & coordinates flows  │
                               └─────────┬────────────────────┬─────────┘
                                         │                    │
                    ┌────────────────────┴───┐            ┌───┴────────────────────┐
                    ▼                        ▼            ▼                        ▼
       Customer Intelligence Agents                  Retail Intelligence Agents
       (Context, Discovery, Friction,                (Sales, Store, Supply-Demand,
        Lost-Sale, Substitutions)                     Returns, Promotions, Next-Best)
                    │                        │            │                        │
                    └────────────────────┬───┘            └───┬────────────────────┘
                                         │                    │
                                         ▼                    ▼
                               ┌────────────────────────────────────────┐
                               │             Evidence Layer             │
                               │   Collects facts, metrics, and sources │
                               └─────────┬────────────────────┬─────────┘
                                         │                    │
               ┌─────────────────────────┴─────────┐          │
               ▼                                   ▼          ▼
    ┌──────────────────────┐             ┌──────────────────────────────┐
    │ BigQuery / SQL       │             │ Vertex AI / Gemini           │
    │ Deterministic counts,│             │ Intent parsing, synthesis,   │
    │ aggregates, metrics  │             │ explanations, rationale      │
    └──────────────────────┘             └──────────────────────────────┘
               │                                   │
               ▼                                   ▼
    ┌──────────────────────┐             ┌──────────────────────────────┐
    │ Cloud Storage        │             │ Vertex AI Search             │
    │ Raw CSVs & artifacts │             │ Product & review retrieval   │
    └──────────────────────┘             └──────────────────────────────┘
```

---

## 3. Layer Breakdown

| Layer | Component | Core Responsibility |
|---|---|---|
| **Presentation** | Next.js Frontend | Dual-domain workspace featuring Customer Intelligence (search, discovery, friction analysis) and Retail Intelligence (Command Center, KPI root causes, recommendation approvals). Uses shared evidence cards and audit views. |
| **API & Routing** | FastAPI (Cloud Run) | Exposes REST endpoints (`/health`, `/api/v1/system`, domain endpoints), manages request authentication, validation, and session states. |
| **Orchestration** | Python Orchestrator | Dynamically determines which specialist agent modules must execute based on the incoming signal, passes shared context, and aggregates agent outputs. |
| **Deterministic Data** | BigQuery / SQL | Executes all metric calculations, aggregation, filtering, and joins. Calculations are never delegated to generative models. |
| **Semantic & Retrieval** | Vertex AI Search | Handles semantic search and retrieval over product catalogs, customer reviews, policies, and store profiles. |
| **Reasoning & Synthesis** | Gemini (Vertex AI) | Translates structured evidence into clear explanations, compares trade-offs, and drafts human-readable recommendations. |
| **Operational State** | Cloud SQL / AlloyDB | Stores investigation traces, evidence manifests, feedback logs, and operator approval statuses. |
| **Storage** | Cloud Storage | Manages raw datasets, generated data assets, and system artifacts. |

---

## 4. Fundamental Engineering Principles

1. **Calculations stay in code and SQL**: Generative models are never used for counting, arithmetic, or financial aggregation.
2. **Gemini reasons over verified evidence**: The model never manufactures facts, hallucinates metrics, or speculates without source data.
3. **Shared Identifiers across Domains**: Customer and business datasets are strictly joined using standard keys:
   - `customer_id`
   - `product_id`
   - `store_id`
   - `order_id`
4. **Runnable Increments**: Every phase produces a standalone runnable service verified with end-to-end integration checks.
5. **Human-in-the-Loop**: Every agent recommendation terminates in an explicit operator approval step (`Approve`, `Reject`, `Investigate Further`).
