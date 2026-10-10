# RetailIQ Demonstration & Verification Guide

> **AI Builder Cup 2026** · Complete local evaluation guide for RetailIQ.
> Follow this guide to start both tiers, reproduce all seeded retail scenarios, and verify end-to-end evidence chains.

---

## 1. Quick Startup Commands

### Step 1: Start Python Backend (FastAPI)
Run from the repository root using the existing `.venv`:
```powershell
# Windows PowerShell
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
*(Or on macOS / Linux: `source .venv/bin/activate && uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`)*

- **Health Probe**: [http://localhost:8000/health](http://localhost:8000/health)
- **Retail Overview API**: [http://localhost:8000/api/v1/retail/overview](http://localhost:8000/api/v1/retail/overview)
- **Interactive OpenAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 2: Start Next.js Frontend
Open a second terminal in `frontend/`:
```bash
cd frontend
npm run dev
```
- **Web Interface**: [http://localhost:3000](http://localhost:3000)

---

## 2. Seeded Retail Scenarios & Example Queries

RetailIQ comes pre-seeded with 5 deterministic, relationally consistent retail scenarios generated from [`data/generated/`](file:///c:/Users/shubh/Desktop/retailIQ/data/generated):

| # | Scenario Title | Target Entities | Source Datasets | Example Query | Expected Finding & Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Cart Abandonment & Price Mismatch** | `CUST-0003`, `PROD-0004` | `customers.csv`, `cart_events.csv`, `products.csv` | `"Investigate checkout abandonment on running shoes for customer CUST-0003"` | Customer in Budget tier (AOV ₹2,400.00) abandoned ₹6,499.00 item without buying due to a 2.7x price gap and zero discounts. |
| **2** | **Inter-Store Inventory Imbalance** | `PROD-0001`, `STORE-001`, `STORE-004` | `inventory.csv`, `stores.csv`, `products.csv` | `"Investigate inventory imbalance and stockout risk across retail stores"` | Store `STORE-001` (Flagship) holds only 2 units (stockout risk) while `STORE-004` (Outlet) holds 85 units (42.5x imbalance). Recommends 41-unit transfer. |
| **3** | **Post-Promotion Sales Cliff** | `PROD-0005` | `orders.csv`, `promotions.csv`, `products.csv` | `"Why did sales drop for seamless training tee after the campaign ended?"` | Order volume plummeted -77.8% (9 orders in Period 1 vs 2 orders in Period 2), dropping net revenue by -69.7% immediately upon expiration of the `MonsoonClearanceEarly` promotion on 2026-09-15. |
| **4** | **Sizing Defect & Return Wave** | `PROD-0006` | `reviews_returns.csv`, `products.csv` | `"Investigate high customer returns and defect complaints on jacket"` | 80.0% return rate (8 returns / 10 customer review records) with 100% of returns citing sizing issues (runs 1–2 sizes small). Average rating: 2.0★. |
| **5** | **Out-of-Stock Smart Substitution** | `PROD-0002` | `products.csv`, `inventory.csv` | `"Find substitute for out-of-stock trail shoes"` | `PROD-0002` is stocked out at flagship locations; evaluates `PROD-0001` as in-stock, in-budget alternative with trade-off analysis. |

---

## 3. End-to-End User Flow Walkthroughs

### User Flow A: Customer Experience & Discovery
1. **Discovery & Filter**:
   - Navigate to **🛍️ Product Discovery**.
   - Type `"black running shoes under 4000"` into the search bar.
   - Observe that the search engine extracts the price ceiling (`<= 4000`) and matches keywords against name, brand, category, and color tags.
   - Click one of the suggested query chips, e.g., *"Cart abandonment on elite road shoes"*.
2. **Investigation & Evidence**:
   - The interface switches automatically to the **🔍 Investigation Engine**.
   - Review the completed `InvestigationResponse`:
     - Summary finding with 93% confidence.
     - Supporting evidence cards from `customers.csv`, `products.csv`, and `cart_events.csv`.
     - Actionable recommendations proposing in-budget alternative routing (`PROD-0001`) or introductory incentives.
3. **Smart Substitution**:
   - Switch to **🔄 Smart Substitution**.
   - Select `PROD-0002` (TrailGrip Pro Mountain Shoe, out of stock).
   - Compare attribute trade-offs against `PROD-0001` (AeroStride Velocity Runner) and stage the substitution.
4. **Customer Friction**:
   - Switch to **⚠️ Customer Friction**.
   - Inspect cards for cart abandonment, stockouts, and return defects with exact dataset citations.

---

### User Flow B: Retailer Intelligence Workspace
1. **Command Center Overview**:
   - Navigate to **🏢 Retail Workspace** in the top navigation.
   - Review top-level KPI cards calculated directly from enterprise CSVs:
     - **Sales Revenue**: ₹72,011.48 (30 orders, AOV ₹2,400.38).
     - **Network Stock**: 2,029 units across 5 stores (2 stockouts, 3 low stock).
     - **Catalog Return Rate**: 50.0% (8 returns / 16 total review rows).
     - **Tracked Promotions**: 9 active/past campaigns.
   - Examine prioritized anomaly signals ranked by severity.
2. **Sales Investigation Deep Dive**:
   - Click the **📉 Sales Investigation** tab or the *"View Section"* button on Signal 2.
   - Review the **Period 1 vs Period 2** comparison:
     - Active Period (through 2026-09-15): 9 orders, ₹9,891.00 net revenue.
     - Post-Promotion: 2 orders, ₹2,998.00 net revenue (-77.8% volume drop).
   - Click **"Launch Deep Investigation"** to open the Investigation Engine with the exact evidence graph.
3. **Supply-Demand Cross-Store Rebalancing**:
   - Click **🏬 Supply-Demand**.
   - View the store-by-store distribution bar chart across all 5 stores.
   - Note `STORE-001` (2 units, critical low) vs `STORE-004` (85 units, excess surplus).
   - Read the grounded transfer recommendation: Transfer 41 units from `STORE-004` to `STORE-001`.
4. **Return Intelligence & Voice of Customer**:
   - Click **↩️ Return Intelligence**.
   - Verify explicit denominators: **8 returns out of 10 reviews (80.0%)** for `PROD-0006`.
   - Read the verbatim customer review quotes extracted directly from `reviews_returns.csv`.
   - Review the benchmark table comparing `PROD-0006` to zero-return items in the catalog.
5. **Next Best Actions (Consolidated Decision Queue)**:
   - Click **⚡ Next Best Actions**.
   - Review the 4 prioritized recommendations consolidated across intelligence agents.
   - Click **Approve (Simulation)** on Action `ACT-INV-001` (41 units transfer).
   - Observe the card state transition to `APPROVED (SIMULATION)` and verify that the decision is recorded in the timestamped **Local Session Decision Audit Log**.
   - Click **Reset Choice** to test reversibility.

---

## 4. Known Limitations & Architecture Principles

1. **Local Simulation Mode**:
   - All approval and rejection controls record decisions in the in-memory session audit log.
   - No live ERP, warehouse management system, or promotional campaigns are dispatched externally.
2. **Deterministic Metric Grounding**:
   - All KPIs, ratios, percentages, and denominators are calculated directly from local CSV datasets via Python and displayed transparently.
   - The engine does not fabricate speculative findings when queries do not match supported scenarios; it returns an explicit `query_matched: false` advisory.
3. **No External Cloud Dependencies Required for Local Evaluation**:
   - The entire evaluation suite runs locally on Windows, macOS, or Linux using Python 3.12 and Node.js without requiring Google Cloud Platform (GCP) credentials or Gemini API keys.

---

## 5. Verification Commands

Run the full automated verification test suite:

```powershell
# 1. Run all backend tests (44 tests)
.\.venv\Scripts\python.exe -m pytest tests -v

# 2. Run system setup & dataset integrity verification
.\.venv\Scripts\python.exe scripts/verify_setup.py

# 3. Run all frontend unit tests (15 tests)
cd frontend
npm test

# 4. Run Next.js production build
npm run build
```
