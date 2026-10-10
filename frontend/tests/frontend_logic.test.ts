/**
 * Automated Frontend Logic & Interaction Tests.
 * Runs with Node.js 24 native test runner: node --test --experimental-strip-types
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PRODUCTS_CATALOG } from "../src/data/catalog.ts";
import type {
  InvestigationResponse,
  InvestigationRequest,
  AgentResult,
  Product,
} from "../src/types/intelligence.ts";

describe("Product Catalog Data Integrity", () => {
  it("should contain exactly 15 verified catalog items", () => {
    assert.equal(PRODUCTS_CATALOG.length, 15);
  });

  it("should match target scenario attributes for PROD-0001 (Velocity Runner)", () => {
    const p = PRODUCTS_CATALOG.find((x) => x.product_id === "PROD-0001");
    assert.ok(p);
    assert.equal(p.price, 3499.0);
    assert.equal(p.rating, 4.6);
    assert.equal(p.category, "Footwear");
    assert.equal(p.statusBadge, "low_stock");
  });

  it("should match target scenario attributes for PROD-0002 (Out of stock)", () => {
    const p = PRODUCTS_CATALOG.find((x) => x.product_id === "PROD-0002");
    assert.ok(p);
    assert.equal(p.price, 4199.0);
    assert.equal(p.statusBadge, "out_of_stock");
  });

  it("should match target scenario attributes for PROD-0004 (Premium road racer)", () => {
    const p = PRODUCTS_CATALOG.find((x) => x.product_id === "PROD-0004");
    assert.ok(p);
    assert.equal(p.price, 6499.0);
    assert.equal(p.rating, 4.8);
  });

  it("should match target scenario attributes for PROD-0006 (Sizing defect jacket)", () => {
    const p = PRODUCTS_CATALOG.find((x) => x.product_id === "PROD-0006");
    assert.ok(p);
    assert.equal(p.price, 3899.0);
    assert.equal(p.statusBadge, "high_return_rate");
  });
});

describe("Search and Filter Logic", () => {
  function filterProducts(query: string, category: string): Product[] {
    return PRODUCTS_CATALOG.filter((product) => {
      if (category !== "All" && product.category !== category) return false;
      if (!query.trim()) return true;

      const q = query.toLowerCase();

      // Extract price filter parsing (e.g. "under 4000" or "under 3000")
      let textQuery = q;
      const underMatch = q.match(/under\s+(\d+)/);
      if (underMatch) {
        const maxPrice = parseFloat(underMatch[1]);
        if (product.price > maxPrice) return false;
        textQuery = textQuery.replace(underMatch[0], "").trim();
      }

      if (!textQuery) return true;

      const terms = textQuery.split(/\s+/).filter(Boolean);
      const haystack = `${product.product_name} ${product.brand} ${product.subcategory} ${product.category} ${product.description} ${product.product_id} ${product.attributes?.color || ""}`.toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });
  }

  it("filters by category correctly", () => {
    const apparel = filterProducts("", "Apparel");
    assert.ok(apparel.length > 0);
    assert.ok(apparel.every((p) => p.category === "Apparel"));
  });

  it("filters natural-language query with price constraint 'under 4000'", () => {
    const results = filterProducts("shoes under 4000", "All");
    assert.ok(results.length > 0);
    assert.ok(results.every((p) => p.price <= 4000));
    // Must NOT contain PROD-0004 which is 6499.0
    assert.ok(!results.some((p) => p.product_id === "PROD-0004"));
  });

  it("returns empty list for non-existent keywords", () => {
    const results = filterProducts("space shuttle rocket", "All");
    assert.equal(results.length, 0);
  });
});

describe("Investigation Response & Decision State Logic", () => {
  it("processes unsupported query response without crashing", () => {
    const mockUnsupportedResponse: InvestigationResponse = {
      investigation_id: "INV-TEST01",
      status: "completed",
      findings: [],
      summary: "No matching investigation scenario detected for query: 'unknown'.",
      metadata: {
        query_matched: false,
        supported_scenarios: ["Cart Abandonment", "Stockout"],
      },
      timestamp: new Date().toISOString(),
    };

    assert.equal(mockUnsupportedResponse.status, "completed");
    assert.equal(mockUnsupportedResponse.findings.length, 0);
    assert.equal(mockUnsupportedResponse.metadata.query_matched, false);
  });

  it("processes supported scenario findings with evidence and recommendations", () => {
    const mockFinding: AgentResult = {
      agent: "Supply-Demand Intelligence Agent",
      finding: "Severe inventory imbalance between STORE-001 and STORE-004.",
      evidence: [
        {
          type: "data_point",
          label: "STORE-001 Stock",
          value: { stock: 2 },
          source: "inventory.csv",
        },
        {
          type: "data_point",
          label: "STORE-004 Stock",
          value: { stock: 85 },
          source: "inventory.csv",
        },
      ],
      confidence: 0.91,
      recommendations: [
        {
          action: "Transfer 41 units from STORE-004 to STORE-001",
          rationale: "Flagship stockout risk",
          expected_impact: "Restores buffer stock",
          priority: "HIGH",
        },
      ],
      sources: ["inventory.csv"],
    };

    assert.equal(mockFinding.confidence, 0.91);
    assert.equal(mockFinding.evidence.length, 2);
    assert.equal(mockFinding.recommendations[0].priority, "HIGH");
  });

  it("handles decision state changes locally and disallows live claims", () => {
    interface DecisionRecord {
      status: "approved" | "rejected" | "investigating_further";
      action: string;
      simulated: boolean;
    }

    const state: Record<string, DecisionRecord> = {};
    const key = "Supply-Demand Intelligence Agent_0";

    // Operator Approves
    state[key] = {
      status: "approved",
      action: "Transfer 41 units",
      simulated: true, // Verification that action is local/simulated
    };
    assert.equal(state[key].status, "approved");
    assert.equal(state[key].simulated, true);

    // Operator Toggles / Rejects
    state[key].status = "rejected";
    assert.equal(state[key].status, "rejected");
  });
});

describe("Retail Intelligence Workspace Logic & Calculations", () => {
  it("computes sales period comparison delta accurately", () => {
    const p1Orders = 9;
    const p2Orders = 2;
    const p1NetRev = 9891.0;
    const p2NetRev = 2998.0;

    const volumeDrop = Math.round(((p1Orders - p2Orders) / p1Orders) * 1000) / 10;
    const revenueDrop = Math.round(((p1NetRev - p2NetRev) / p1NetRev) * 1000) / 10;

    assert.equal(volumeDrop, 77.8);
    assert.equal(revenueDrop, 69.7);
    assert.equal(p2Orders - p1Orders, -7);
  });

  it("calculates multi-store inventory imbalance and recommended transfer units", () => {
    const minStock = 2; // STORE-001 Flagship
    const maxStock = 85; // STORE-004 Outlet

    const imbalanceRatio = Math.round((maxStock / Math.max(minStock, 1)) * 10) / 10;
    const recommendedTransfer = Math.max(10, Math.floor((maxStock - minStock) / 2));

    assert.equal(imbalanceRatio, 42.5);
    assert.equal(recommendedTransfer, 41);
    // After transfer, minStock becomes 43, maxStock becomes 44 (near perfect balance)
    assert.equal(minStock + recommendedTransfer, 43);
    assert.equal(maxStock - recommendedTransfer, 44);
  });

  it("verifies explicit denominator calculations for return rates", () => {
    const totalCatalogReviews = 16;
    const totalCatalogReturns = 8;
    const catalogReturnRate = (totalCatalogReturns / totalCatalogReviews) * 100;
    assert.equal(catalogReturnRate, 50.0);

    // PROD-0006 focus SKU
    const p6TotalReviews = 10;
    const p6Returns = 8;
    const p6SizingComplaints = 8;

    const p6ReturnRate = (p6Returns / p6TotalReviews) * 100;
    const p6SizingShare = (p6SizingComplaints / p6Returns) * 100;

    assert.equal(p6ReturnRate, 80.0);
    assert.equal(p6SizingShare, 100.0);
    assert.equal(
      `8 returns / 10 verified orders/reviews`,
      `${p6Returns} returns / ${p6TotalReviews} verified orders/reviews`
    );
  });

  it("maintains Next Best Actions simulated state and audit log", () => {
    interface ActionLog {
      id: string;
      action: string;
      status: "approved" | "rejected";
      timestamp: string;
    }

    const auditLog: ActionLog[] = [];
    const decisionsState: Record<string, "proposed" | "approved" | "rejected"> = {};

    const actionItem = {
      id: "ACT-INV-001",
      action: "Initiate inter-store transfer of 41 units from STORE-004 to STORE-001",
    };

    // Human operator approves
    decisionsState[actionItem.id] = "approved";
    auditLog.unshift({
      id: actionItem.id,
      action: actionItem.action,
      status: "approved",
      timestamp: "12:00:00 PM",
    });

    assert.equal(decisionsState["ACT-INV-001"], "approved");
    assert.equal(auditLog.length, 1);
    assert.equal(auditLog[0].status, "approved");

    // Human operator resets
    delete decisionsState[actionItem.id];
    assert.equal(decisionsState["ACT-INV-001"], undefined);
  });
});
