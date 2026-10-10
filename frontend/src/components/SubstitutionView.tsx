"use client";

import React, { useState } from "react";
import { PRODUCTS_CATALOG } from "@/data/catalog";
import { Product } from "@/types/intelligence";

interface SubstitutionViewProps {
  initialProductId?: string;
  onTriggerInvestigation: (query: string, productId?: string) => void;
}

interface SubstitutionPair {
  target: Product;
  triggerReason: "out_of_stock" | "over_budget";
  reasonHeadline: string;
  substitutes: {
    product: Product;
    matchScore: number;
    tradeOffSummary: string;
    priceDelta: number;
    savingsText: string;
    attributesComparison: { label: string; original: string; substitute: string; advantage: "substitute" | "original" | "neutral" }[];
  }[];
}

export function SubstitutionView({
  initialProductId = "PROD-0002",
  onTriggerInvestigation,
}: SubstitutionViewProps) {
  const [selectedCase, setSelectedCase] = useState<"PROD-0002" | "PROD-0004">(
    initialProductId === "PROD-0004" ? "PROD-0004" : "PROD-0002"
  );
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const [appliedSub, setAppliedSub] = useState<string | null>(null);

  const getProduct = (id: string) => PRODUCTS_CATALOG.find((p) => p.product_id === id)!;

  const substitutionCases: Record<string, SubstitutionPair> = {
    "PROD-0002": {
      target: getProduct("PROD-0002"),
      triggerReason: "out_of_stock",
      reasonHeadline: "Local Stockout at STORE-001 (Mumbai Flagship)",
      substitutes: [
        {
          product: getProduct("PROD-0001"),
          matchScore: 92,
          tradeOffSummary: "Lower price with active ₹350 promotion; road-oriented responsive foam instead of rugged trail Vibram grip.",
          priceDelta: getProduct("PROD-0001").price - getProduct("PROD-0002").price,
          savingsText: "Save ₹700 + ₹350 Promo Voucher",
          attributesComparison: [
            { label: "Availability", original: "Out of Stock (STORE-001)", substitute: "In Stock (Express Delivery)", advantage: "substitute" },
            { label: "Price", original: "₹4,199.00", substitute: "₹3,499.00", advantage: "substitute" },
            { label: "Rating", original: "4.4 ★ (Verified)", substitute: "4.6 ★ (+0.2 Higher)", advantage: "substitute" },
            { label: "Terrain Specialty", original: "Trail & Mountain Hikes", substitute: "Marathon & Road Running", advantage: "original" },
            { label: "Upper & Color", original: "Olive Green / Reinforced", substitute: "Black / Breathable Mesh", advantage: "neutral" },
          ],
        },
        {
          product: getProduct("PROD-0003"),
          matchScore: 85,
          tradeOffSummary: "Significant budget savings (₹1,400 cheaper); cross-training gel sole suitable for gym and light running.",
          priceDelta: getProduct("PROD-0003").price - getProduct("PROD-0002").price,
          savingsText: "Save ₹1,400 + ₹300 Bonus",
          attributesComparison: [
            { label: "Availability", original: "Out of Stock (STORE-001)", substitute: "In Stock (Same-day)", advantage: "substitute" },
            { label: "Price", original: "₹4,199.00", substitute: "₹2,799.00", advantage: "substitute" },
            { label: "Rating", original: "4.4 ★", substitute: "4.2 ★", advantage: "original" },
            { label: "Terrain Specialty", original: "Technical Trails", substitute: "Gym & Cross-Training", advantage: "neutral" },
          ],
        },
      ],
    },
    "PROD-0004": {
      target: getProduct("PROD-0004"),
      triggerReason: "over_budget",
      reasonHeadline: "Price Sensitivity Mismatch (2.71x Customer AOV of ₹2,400)",
      substitutes: [
        {
          product: getProduct("PROD-0001"),
          matchScore: 95,
          tradeOffSummary: "Saves ₹3,000 while maintaining marathon distance capability; standard responsive foam instead of full carbon plate.",
          priceDelta: getProduct("PROD-0001").price - getProduct("PROD-0004").price,
          savingsText: "Save ₹3,000 (Fits Budget Tier)",
          attributesComparison: [
            { label: "Price Alignment", original: "₹6,499.00 (Exceeds Budget)", substitute: "₹3,499.00 (Matches ₹2.4k-3.5k Tier)", advantage: "substitute" },
            { label: "Discounts", original: "Zero Active Promotions", substitute: "₹350 Active Kickoff Discount", advantage: "substitute" },
            { label: "Propulsion Tech", original: "Full Carbon Fiber Plate", substitute: "Responsive High-Rebound Foam", advantage: "original" },
            { label: "Customer Target", original: "Elite Racer Tier", substitute: "Daily Marathoner Tier", advantage: "neutral" },
            { label: "Rating", original: "4.8 ★", substitute: "4.6 ★", advantage: "neutral" },
          ],
        },
        {
          product: getProduct("PROD-0014"),
          matchScore: 82,
          tradeOffSummary: "Deep budget choice at ₹1,205; highly accessible price with solid 4.7-star rating.",
          priceDelta: getProduct("PROD-0014").price - getProduct("PROD-0004").price,
          savingsText: "Save ₹5,294 (Under Budget)",
          attributesComparison: [
            { label: "Price Alignment", original: "₹6,499.00", substitute: "₹1,205.21", advantage: "substitute" },
            { label: "Rating", original: "4.8 ★", substitute: "4.7 ★", advantage: "neutral" },
            { label: "Category Match", original: "Marathon Racer", substitute: "Distance Road Trainer", advantage: "neutral" },
          ],
        },
      ],
    },
  };

  const currentCase = substitutionCases[selectedCase];
  const activeSub = currentCase.substitutes[selectedSubIndex] || currentCase.substitutes[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
          <span>🔄</span>
          <span>Smart Substitution Agent</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Intelligent Product Substitution & Trade-Off Engine
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          When a customer encounters an unavailable product or a price barrier, the Smart Substitution Agent evaluates catalog alternatives, calculates exact price deltas, and clearly distinguishes verified dataset values from suggested match metrics.
        </p>

        {/* Case Switcher Tabs */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => {
              setSelectedCase("PROD-0002");
              setSelectedSubIndex(0);
              setAppliedSub(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              selectedCase === "PROD-0002"
                ? "bg-rose-950/80 text-rose-200 border-rose-700 shadow-md"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            📦 Scenario 1: Out-of-Stock Item (PROD-0002 Trail Hiker)
          </button>
          <button
            onClick={() => {
              setSelectedCase("PROD-0004");
              setSelectedSubIndex(0);
              setAppliedSub(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              selectedCase === "PROD-0004"
                ? "bg-indigo-950/80 text-indigo-200 border-indigo-700 shadow-md"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            💰 Scenario 2: Over-Budget Item (PROD-0004 Carbon Racer)
          </button>
        </div>
      </section>

      {/* Main Comparison Matrix */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Target Item (The Friction Trigger) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                Actual Target Item (Friction Point)
              </span>
              <h3 className="text-base font-bold text-white">{currentCase.target.product_name}</h3>
            </div>
            <span className="font-mono text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
              {currentCase.target.product_id}
            </span>
          </div>

          {/* Trigger Alert Callout */}
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/60 text-xs text-rose-200 space-y-1">
            <div className="font-bold text-rose-400 flex items-center space-x-1.5">
              <span>⚠️</span>
              <span>{currentCase.reasonHeadline}</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Customer intent cannot be fulfilled by this SKU without operational friction.
            </p>
          </div>

          {/* Target Specs */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Catalog Price:</span>
              <span className="font-bold text-white">₹{currentCase.target.price.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Customer Rating:</span>
              <span className="text-amber-400 font-semibold">{currentCase.target.rating} ★</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Category / Brand:</span>
              <span className="text-slate-200">{currentCase.target.brand} · {currentCase.target.category}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Attributes:</span>
              <span className="text-slate-300">
                {Object.entries(currentCase.target.attributes)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(",") : v}`)
                  .join(" | ")}
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              onTriggerInvestigation(
                `Investigate friction and substitution options for ${currentCase.target.product_id}`,
                currentCase.target.product_id
              )
            }
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            🔍 Run Root-Cause Investigation on this SKU
          </button>
        </div>

        {/* Right Column: Suggested Matches & Trade-Off Comparison */}
        <div className="lg:col-span-7 rounded-2xl border border-indigo-900/60 bg-slate-900/80 p-6 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                AI Suggested Substitution ({activeSub.matchScore}% Match Score)
              </span>
              <h3 className="text-lg font-bold text-white">{activeSub.product.product_name}</h3>
            </div>
            <div className="flex items-center space-x-1.5">
              {currentCase.substitutes.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSubIndex(idx)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border ${
                    selectedSubIndex === idx
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  Option {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Trade-Off Explanation Banner */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300">Why this substitution?</span>
              <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                {activeSub.savingsText}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{activeSub.tradeOffSummary}</p>
          </div>

          {/* Detailed Attribute Comparison Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Direct Trade-Off Breakdown:
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70 text-xs">
              <div className="grid grid-cols-3 bg-slate-900/90 p-2.5 font-bold text-slate-400 border-b border-slate-800">
                <div>Metric / Attribute</div>
                <div className="text-slate-400">Original (Target)</div>
                <div className="text-indigo-400">Proposed Match</div>
              </div>
              <div className="divide-y divide-slate-800/70">
                {activeSub.attributesComparison.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-cols-3 p-2.5 items-center">
                    <div className="font-medium text-slate-300">{row.label}</div>
                    <div className="text-slate-400">{row.original}</div>
                    <div
                      className={`font-semibold flex items-center space-x-1 ${
                        row.advantage === "substitute"
                          ? "text-emerald-400"
                          : row.advantage === "original"
                          ? "text-amber-400"
                          : "text-slate-200"
                      }`}
                    >
                      <span>{row.substitute}</span>
                      {row.advantage === "substitute" && <span>✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Decision */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-400">
              {appliedSub === activeSub.product.product_id ? (
                <div className="space-y-0.5">
                  <span className="text-emerald-400 font-bold">✓ Replacement Selected in Local Session</span>
                  <p className="text-[11px] text-slate-500">
                    Staged in demonstration cart. No external transactional or payment systems were modified.
                  </p>
                </div>
              ) : (
                <span className="text-slate-500">Awaiting user confirmation to stage replacement</span>
              )}
            </div>
            <div className="flex items-center space-x-2.5 w-full sm:w-auto">
              {appliedSub === activeSub.product.product_id ? (
                <button
                  onClick={() => setAppliedSub(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 bg-slate-800 hover:text-white transition-colors"
                >
                  Reset Choice
                </button>
              ) : null}
              <button
                onClick={() => setAppliedSub(activeSub.product.product_id)}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  appliedSub === activeSub.product.product_id
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {appliedSub === activeSub.product.product_id ? "✓ Replacement Staged" : "Accept Substitution"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
