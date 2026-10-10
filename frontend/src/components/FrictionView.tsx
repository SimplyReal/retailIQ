"use client";

import React, { useState } from "react";

interface FrictionViewProps {
  onTriggerInvestigation: (query: string, productId?: string, customerId?: string) => void;
  onNavigateSubstitution: (productId: string) => void;
}

export function FrictionView({
  onTriggerInvestigation,
  onNavigateSubstitution,
}: FrictionViewProps) {
  const [resolvedFrictions, setResolvedFrictions] = useState<Record<string, string>>({});

  const frictionCards = [
    {
      id: "friction-abandonment",
      title: "Cart Abandonment & Price Mismatch",
      severity: "HIGH",
      badgeColor: "bg-rose-950 text-rose-300 border-rose-800",
      customerContext: "CUST-0003 (Budget Tier · Avg Order: ₹2,400.00)",
      targetSKU: "PROD-0004 (AeroStride Apex Carbon Road Racer · ₹6,499.00)",
      frictionType: "Pre-Purchase Cart Friction",
      summary:
        "Customer engaged with elite marathon shoe for 185 seconds and added to cart, then abandoned checkout. The unit price exceeds their average order value by 2.71x with zero active promotional discounts.",
      evidencePoints: [
        { label: "Price Gap", value: "+₹4,099.00 above average spend", source: "calculated.customers_products" },
        { label: "Cart Action", value: "Added then abandoned (0 completed orders)", source: "cart_events.csv" },
        { label: "Active Discounts", value: "₹0.00 (No campaigns eligible)", source: "promotions.csv" },
      ],
      investigationQuery: "Investigate checkout abandonment on running shoes for customer CUST-0003",
      productId: "PROD-0004",
      customerId: "CUST-0003",
      primaryActionText: "🔍 Investigate Price Friction",
      secondaryActionText: "🔄 Route to Budget Substitute (PROD-0001)",
      secondaryActionHandler: "substitute_prod4",
    },
    {
      id: "friction-stockout",
      title: "Local Store Stockout & Search Failure",
      severity: "HIGH",
      badgeColor: "bg-amber-950 text-amber-300 border-amber-800",
      customerContext: "CUST-0002 (Mumbai · Footwear Preferred)",
      targetSKU: "PROD-0002 (TerraFlex TrailClimb Pro Hiker · ₹4,199.00)",
      frictionType: "Discovery & Availability Friction",
      summary:
        "Customer searched for size UK 9 trail shoes and navigated to product page, but local flagship store (STORE-001) is completely stocked out (0 units on hand). Customer abandoned the session without purchase.",
      evidencePoints: [
        { label: "Local Stock Level", value: "0 units (out_of_stock) at STORE-001", source: "inventory.csv" },
        { label: "Network Surplus", value: "STORE-004 holds 85 units of PROD-0001", source: "inventory.csv" },
        { label: "Search Intent", value: "'TerraFlex trail climbing shoes UK 9'", source: "search_events.csv" },
      ],
      investigationQuery: "Investigate inventory imbalance and stockout risk across retail stores",
      productId: "PROD-0002",
      customerId: "CUST-0002",
      primaryActionText: "🔍 Investigate Network Stock Imbalance",
      secondaryActionText: "🔄 Offer In-Stock Substitute",
      secondaryActionHandler: "substitute_prod2",
    },
    {
      id: "friction-return-defect",
      title: "Post-Purchase Sizing Defect & Return Wave",
      severity: "CRITICAL",
      badgeColor: "bg-red-950 text-red-300 border-red-800",
      customerContext: "Affected: 8 Verified Buyers Across Delhi & Mumbai",
      targetSKU: "PROD-0006 (UrbanPeak StormShield Packable Jacket · ₹3,899.00)",
      frictionType: "Post-Purchase Quality Friction",
      summary:
        "Product exhibits an abnormal 80.0% return rate with an average rating of 2.0 / 5.0. 100% of return tickets report identical sizing discrepancies: garments fit 2 sizes smaller than labeled with restrictive chest dimensions.",
      evidencePoints: [
        { label: "Return Rate", value: "8 returns out of 10 orders (80.0%)", source: "reviews_returns.csv" },
        { label: "Average Rating", value: "2.0 / 5.0 (Severe negative sentiment)", source: "reviews_returns.csv" },
        { label: "Primary Quote", value: "'Runs at least two sizes smaller than labeled'", source: "reviews_returns.csv" },
      ],
      investigationQuery: "Investigate high customer returns and defect complaints on jacket",
      productId: "PROD-0006",
      customerId: "",
      primaryActionText: "🔍 Run Return Intelligence Investigation",
      secondaryActionText: "📋 Apply Sizing Fit Advisory",
      secondaryActionHandler: "advisory_banner",
    },
  ];

  const handleResolve = (frictionId: string, actionName: string) => {
    setResolvedFrictions((prev) => ({
      ...prev,
      [frictionId]: actionName,
    }));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-semibold">
          <span>⚠️</span>
          <span>Customer Friction Detection Agent</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Customer Struggle & Journey Friction Feed
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Real-time detection of customer struggle across the purchase lifecycle: cart abandonment, stockout drop-offs, and post-purchase sizing returns. Every alert links directly to verified dataset evidence and actionable interventions.
        </p>
      </section>

      {/* Friction Cards Grid */}
      <section className="space-y-6">
        {frictionCards.map((card) => {
          const isResolved = Boolean(resolvedFrictions[card.id]);

          return (
            <div
              key={card.id}
              className={`rounded-2xl border transition-all p-6 sm:p-8 space-y-6 shadow-lg ${
                isResolved
                  ? "bg-slate-950/60 border-emerald-900/60 opacity-90"
                  : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center space-x-2.5 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${card.badgeColor}`}>
                      {card.severity} FRICTION
                    </span>
                    <span className="text-xs font-medium text-slate-400">{card.frictionType}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{card.title}</h3>
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-400">Context: <span className="text-white font-medium">{card.customerContext}</span></div>
                  <div className="text-indigo-400 font-mono text-[11px]">{card.targetSKU}</div>
                </div>
              </div>

              {/* Summary Description */}
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
                {card.summary}
              </p>

              {/* Evidence Points */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Telemetry Evidence:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {card.evidencePoints.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1"
                    >
                      <div className="text-slate-400 font-medium">{ev.label}</div>
                      <div className="font-bold text-white font-mono text-[11px]">{ev.value}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{ev.source}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="text-xs text-slate-400">
                  {isResolved ? (
                    <div className="space-y-0.5">
                      <span className="text-emerald-400 font-semibold">
                        ✓ Staged: {resolvedFrictions[card.id]}
                      </span>
                      <p className="text-[10px] text-slate-500">
                        Local audit record created. Production warehouse and catalog updates are not dispatched.
                      </p>
                    </div>
                  ) : (
                    <span>Status: Active friction signal awaiting operator action</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      onTriggerInvestigation(card.investigationQuery, card.productId, card.customerId)
                    }
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md"
                  >
                    {card.primaryActionText}
                  </button>

                  <button
                    onClick={() => {
                      if (card.secondaryActionHandler === "substitute_prod2") {
                        onNavigateSubstitution("PROD-0002");
                      } else if (card.secondaryActionHandler === "substitute_prod4") {
                        onNavigateSubstitution("PROD-0004");
                      } else {
                        handleResolve(card.id, "Fit Advisory Banner Queued for Publishing");
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    {card.secondaryActionText}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
