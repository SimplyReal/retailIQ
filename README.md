# RetailIQ

> **An AI intelligence layer for the entire retail journey.**  
> Built for AI Builder Cup 2026 — Retail & Commerce: Intelligent Customer and Business Experiences.

RetailIQ is an investigation and decision layer connecting customer behavior, retail operations, and business intelligence. Instead of functioning solely as a chatbot or product recommender, RetailIQ operates on an evidence-based investigation loop:

$$\text{Signal} \longrightarrow \text{Context} \longrightarrow \text{Investigation} \longrightarrow \text{Evidence} \longrightarrow \text{Explanation} \longrightarrow \text{Recommendation} \longrightarrow \text{Human Decision}$$

---

## 1. Core Capabilities

### Customer Intelligence
- **Natural-Language Discovery**: Matches shopper intent to products and explains why.
- **Smart Substitutions**: Evaluates trade-offs when products are out of stock or unsuitable.
- **Customer Friction Detection**: Highlights points of struggle across search, cart, and delivery.
- **Lost Sale Investigation**: Diagnoses abandonment using behavioral and operational signals.

### Retail / Business Intelligence
- **Sales Investigation**: Decomposes revenue anomalies across stores, items, and promotions.
- **Store Performance**: Isolates store-level operational and commercial drivers.
- **Supply-Demand Intelligence**: Flags imminent stockouts, overstock, and distribution mismatches.
- **Return Intelligence**: Correlates return rates with customer reviews and product defects.
- **Next-Best-Action**: Translates analytical findings into prioritized operator actions for human sign-off.

---

## 2. Monorepo Structure

```text
retailIQ/
├── backend/                  # FastAPI Python 3.12 service
│   ├── app/                  # Application source (core, api, routers)
│   ├── requirements.txt      # Backend Python dependencies
│   └── tests/                # Backend unit and integration tests
├── frontend/                 # Next.js + TypeScript web client
│   ├── src/                  # Application source (pages/app, components)
│   ├── package.json          # Node dependencies and scripts
│   └── tsconfig.json         # TypeScript configuration
├── data/
│   ├── raw/                  # Source / seed CSV datasets
│   ├── generated/            # Synthesized and calibrated datasets
│   └── schemas/              # Pydantic schemas and table definitions
├── docs/                     # Specifications and architectural documentation
│   ├── product-spec.md       # Locked product specification (source of truth)
│   ├── architecture.md       # High-level architecture and GCP component roles
│   ├── agents.md             # Agent specifications and response contracts
│   ├── datasets.md           # Schema blueprint and relational keys
│   └── api.md                # REST API specifications
├── infra/                    # Deployment configurations (Cloud Run, BigQuery DDL)
├── scripts/                  # Development, validation, and data generation utilities
├── tests/                    # Top-level cross-domain end-to-end tests
├── .env.example              # Template environment configuration
├── .gitignore                # Git ignore rules for Python, Node, and environments
└── README.md                 # Project entry point
```

---

## 3. Quickstart

### Prerequisites
- Python 3.12 (using `.venv`)
- Node.js 18+ and npm

### Backend Setup & Execution

1. Activate the Python virtual environment:
   - **Windows (PowerShell)**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
     *(Or run directly with `.\.venv\Scripts\python.exe`)*
   - **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```

2. Install backend dependencies into the existing virtual environment:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Run the FastAPI development server:
   ```bash
   python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   - Health check: `http://localhost:8000/health`
   - System status: `http://localhost:8000/api/v1/system`
   - Interactive OpenAPI docs: `http://localhost:8000/docs`

### Frontend Setup & Execution

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the Next.js development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Documentation Index

- [Product Specification (Locked)](file:///c:/Users/shubh/Desktop/retailIQ/docs/product-spec.md)
- [System Architecture](file:///c:/Users/shubh/Desktop/retailIQ/docs/architecture.md)
- [Agent Specifications](file:///c:/Users/shubh/Desktop/retailIQ/docs/agents.md)
- [Dataset Blueprints](file:///c:/Users/shubh/Desktop/retailIQ/docs/datasets.md)
- [API Documentation](file:///c:/Users/shubh/Desktop/retailIQ/docs/api.md)
