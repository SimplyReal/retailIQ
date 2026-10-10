"use client";

import React, { useState, useEffect } from "react";
import {
  RetailOverview,
  RetailSignal,
  DecisionQueueItem,
} from "@/types/intelligence";

interface RetailWorkspaceViewProps {
  apiUrl: string;
  backendHealth: "online" | "checking..." | "offline";
  onTriggerInvestigation: (query: string, productId?: string, customerId?: string) => void;
}

type SubSection = "command" | "sales" | "inventory" | "returns" | "actions";

export function RetailWorkspaceView({
  apiUrl,
  backendHealth,
  onTriggerInvestigation,
}: RetailWorkspaceViewProps) {
  const [activeSubSection, setActiveSubSection] = useState<SubSection>("command");
  const [overview, setOverview] = useState<RetailOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Local simulated decisions state
  const [decisionsState, setDecisionsState] = useState<
    Record<string, { status: "proposed" | "approved" | "rejected"; timestamp: string }>
  >({});
  const [auditLog, setAuditLog] = useState<
    { id: string; action: string; status: "approved" | "rejected"; timestamp: string }[]
  >([]);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/retail/overview`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        throw new Error(`Failed to load retail analytics: HTTP ${res.status}`);
      }
      const data: RetailOverview = await res.json();
      setOverview(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load Retail Intelligence overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [apiUrl]);

  const handleDecision = (item: DecisionQueueItem, action: "approved" | "rejected") => {
    const ts = new Date().toLocaleTimeString();
    setDecisionsState((prev) => ({
      ...prev,
      [item.id]: { status: action, timestamp: ts },
    }));

    setAuditLog((prev) => [
      {
        id: item.id,
        action: item.action,
        status: action,
        timestamp: ts,
      },
      ...prev,
    ]);
  };

  const handleResetDecision = (id: string) => {
    setDecisionsState((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const navItems: { id: SubSection; label: string; icon: string; badge?: string }[] = [
    { id: "command", label: "Command Center", icon: "📊", badge: "Overview" },
    { id: "sales", label: "Sales Investigation", icon: "📉", badge: "-77.8% Drop" },
    { id: "inventory", label: "Supply-Demand", icon: "🏬", badge: "42.5x Gap" },
    { id: "returns", label: "Return Intelligence", icon: "↩️", badge: "80% Return" },
    { id: "actions", label: "Next Best Actions", icon: "⚡", badge: "Queue" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Retail Intelligence Workspace
            </h1>
            <span className="bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
              Data-Grounded
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time business signals, cross-store inventory telemetry, and post-promotion root causes calculated directly from enterprise CSV datasets.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition flex items-center space-x-1.5"
          >
            <span>🔄</span>
            <span>{loading ? "Calculating..." : "Refresh Datasets"}</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto border-b border-slate-800 pb-2 scrollbar-none">
        {navItems.map((tab) => {
          const isActive = activeSubSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubSection(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isActive ? "bg-indigo-800 text-indigo-200" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && !overview && (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <div className="inline-block animate-spin text-3xl">⏳</div>
          <h3 className="text-sm font-semibold text-slate-300">Calculating dataset metrics...</h3>
          <p className="text-xs text-slate-500">Querying orders.csv, inventory.csv, promotions.csv, and reviews_returns.csv</p>
        </div>
      )}

      {/* Error / Backend Offline State */}
      {error && (
        <div className="p-6 bg-rose-950/30 border border-rose-900/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="text-sm font-bold text-rose-300">Retail Intelligence API Unavailable</h4>
              <p className="text-xs text-rose-400/80 mt-0.5">{error}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Ensure the FastAPI backend is running at <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300">{apiUrl}</code>.
              </p>
            </div>
          </div>
          <button
            onClick={fetchOverview}
            className="px-4 py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold rounded-lg border border-rose-700"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Content Sections */}
      {overview && (
        <>
          {/* SECTION 1: COMMAND CENTER */}
          {activeSubSection === "command" && (
            <div className="space-y-6">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sales KPI */}
                <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Net Sales Revenue</span>
                    <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 text-[10px]">
                      30 Orders
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white tracking-tight">
                    ₹{overview.kpis.sales.total_revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                    <span>AOV: ₹{overview.kpis.sales.average_order_value.toFixed(2)}</span>
                    <span className="text-indigo-400 cursor-pointer hover:underline" onClick={() => setActiveSubSection("sales")}>
                      View Sales ↗
                    </span>
                  </div>
                </div>

                {/* Inventory KPI */}
                <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Network Stock</span>
                    <span className="text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 text-[10px]">
                      5 Stores
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white tracking-tight">
                    {overview.kpis.inventory.total_network_units.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                    <span className="text-rose-400 font-medium">{overview.kpis.inventory.out_of_stock_count} Out-of-Stock SKUs</span>
                    <span className="text-indigo-400 cursor-pointer hover:underline" onClick={() => setActiveSubSection("inventory")}>
                      Balance ↗
                    </span>
                  </div>
                </div>

                {/* Returns KPI */}
                <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Overall Return Rate</span>
                    <span className="text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800 text-[10px]">
                      {overview.kpis.returns.total_returns}/{overview.kpis.returns.total_reviews} Records
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-rose-400 tracking-tight">
                    {overview.kpis.returns.overall_return_rate_pct}%
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                    <span>Focus SKU: 80% Returns</span>
                    <span className="text-indigo-400 cursor-pointer hover:underline" onClick={() => setActiveSubSection("returns")}>
                      Returns ↗
                    </span>
                  </div>
                </div>

                {/* Promotions KPI */}
                <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Active Campaigns</span>
                    <span className="text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800 text-[10px]">
                      {overview.kpis.promotions.active_campaign_count} Tracked
                    </span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white tracking-tight">
                    {overview.kpis.promotions.active_campaign_count} <span className="text-xs font-normal text-slate-400">Campaigns</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                    <span className="text-amber-400 font-medium">1 Post-Promo Cliff</span>
                    <span className="text-indigo-400 cursor-pointer hover:underline" onClick={() => setActiveSubSection("actions")}>
                      Actions ↗
                    </span>
                  </div>
                </div>
              </div>

              {/* Prioritized Anomaly Signals */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>⚡</span>
                      <span>Prioritized Retail Signals & Anomalies</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ranked by business severity and backed by direct dataset observations
                    </p>
                  </div>
                  <span className="text-xs text-indigo-400 font-mono bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-800">
                    {overview.signals.length} Active Anomalies
                  </span>
                </div>

                <div className="space-y-3">
                  {overview.signals.map((signal) => (
                    <div
                      key={signal.id}
                      className="p-4 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                              signal.severity === "CRITICAL"
                                ? "bg-rose-950 text-rose-300 border border-rose-800"
                                : signal.severity === "HIGH"
                                ? "bg-amber-950 text-amber-300 border border-amber-800"
                                : "bg-blue-950 text-blue-300 border border-blue-800"
                            }`}
                          >
                            {signal.severity}
                          </span>
                          <span className="text-xs font-semibold text-white">{signal.title}</span>
                          <span className="text-[11px] text-slate-500 font-mono">({signal.product_id})</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{signal.summary}</p>
                        <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                          <span>
                            Denominator: <strong className="text-slate-300 font-mono">{signal.denominator}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded border border-indigo-800">
                          {signal.metric_value}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setActiveSubSection(signal.action_tab as SubSection)}
                            className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
                          >
                            View Section
                          </button>
                          <button
                            onClick={() => onTriggerInvestigation(signal.investigation_query, signal.product_id)}
                            className="px-2.5 py-1 text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded transition shadow-sm shadow-indigo-600/30"
                          >
                            Investigate ↗
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: SALES INVESTIGATION */}
          {activeSubSection === "sales" && (
            <div className="space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white">Post-Promotion Sales Decline Analysis</span>
                      <span className="text-[11px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800 font-mono">
                        PROD-0005
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {overview.sales_analytics.product_name} · Campaign: "{overview.sales_analytics.promotion_lifecycle.campaign_name}" (Expired {overview.sales_analytics.promotion_lifecycle.campaign_end_date})
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      onTriggerInvestigation(
                        "Why did sales drop for seamless training tee after the campaign ended?",
                        overview.sales_analytics.product_id
                      )
                    }
                    className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm shadow-indigo-600/30 flex items-center space-x-1.5"
                  >
                    <span>🔍</span>
                    <span>Launch Deep Investigation</span>
                  </button>
                </div>

                {/* Period 1 vs Period 2 Metric Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      Period 1: Active Promotion
                    </div>
                    <div className="text-lg font-bold text-emerald-400">
                      {overview.sales_analytics.period_1_promo.orders_count} Orders
                    </div>
                    <div className="text-xs text-slate-300">
                      Net Revenue: ₹{overview.sales_analytics.period_1_promo.net_revenue.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Discount total: ₹{overview.sales_analytics.period_1_promo.discount_total.toLocaleString("en-IN")} (₹400/order)
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      Period 2: Post-Promotion
                    </div>
                    <div className="text-lg font-bold text-rose-400">
                      {overview.sales_analytics.period_2_post_promo.orders_count} Orders
                    </div>
                    <div className="text-xs text-slate-300">
                      Net Revenue: ₹{overview.sales_analytics.period_2_post_promo.net_revenue.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Full regular price (₹1,499.00), zero discounts applied
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      Calculated Impact Delta
                    </div>
                    <div className="text-lg font-bold text-rose-400">
                      -{overview.sales_analytics.calculated_changes.order_volume_drop_pct}% Volume
                    </div>
                    <div className="text-xs text-slate-300">
                      Revenue Drop: -{overview.sales_analytics.calculated_changes.net_revenue_drop_pct}%
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Delta: {overview.sales_analytics.calculated_changes.volume_delta_orders} orders / -₹{Math.abs(overview.sales_analytics.calculated_changes.net_revenue_delta_inr).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Evidence & Recommendation */}
                <div className="p-4 bg-indigo-950/20 border border-indigo-900/60 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
                    <span>💡</span>
                    <span>Investigation Recommendation & Next Action</span>
                  </div>
                  <p className="text-xs text-slate-200">
                    {overview.sales_analytics.investigation_recommendation.action}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    <strong>Rationale:</strong> {overview.sales_analytics.investigation_recommendation.rationale}
                  </p>
                  <div className="flex items-center space-x-3 text-[10px] text-indigo-400 font-mono">
                    <span>Priority: {overview.sales_analytics.investigation_recommendation.priority}</span>
                    <span>·</span>
                    <span>Confidence: {(overview.sales_analytics.investigation_recommendation.confidence * 100).toFixed(0)}%</span>
                    <span>·</span>
                    <span>Source: orders.csv & promotions.csv</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SUPPLY-DEMAND INTELLIGENCE */}
          {activeSubSection === "inventory" && (
            <div className="space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white">Cross-Store Stock Imbalance Telemetry</span>
                      <span className="text-[11px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 font-mono">
                        {overview.inventory_analytics.product_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {overview.inventory_analytics.product_name} · Total Network Stock: {overview.inventory_analytics.total_network_stock} units across 5 stores
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      onTriggerInvestigation(
                        "Investigate inventory imbalance and stockout risk across retail stores",
                        overview.inventory_analytics.product_id
                      )
                    }
                    className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm shadow-indigo-600/30 flex items-center space-x-1.5"
                  >
                    <span>🔍</span>
                    <span>Launch Inventory Investigation</span>
                  </button>
                </div>

                {/* Imbalance Highlight Card */}
                <div className="p-4 bg-amber-950/20 border border-amber-900/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">⚖️</span>
                    <div>
                      <div className="text-xs font-bold text-amber-300">
                        {overview.inventory_analytics.imbalance_ratio}x Stock Imbalance Detected
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Deficit Store: <strong className="text-rose-400">{overview.inventory_analytics.deficit_store.store_id} ({overview.inventory_analytics.deficit_store.store_name})</strong> holds only {overview.inventory_analytics.deficit_store.stock} units vs Surplus Store: <strong className="text-emerald-400">{overview.inventory_analytics.surplus_store.store_id} ({overview.inventory_analytics.surplus_store.store_name})</strong> holding {overview.inventory_analytics.surplus_store.stock} units.
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 text-center shrink-0">
                    <span className="text-[10px] text-slate-400 block">Recommended Transfer</span>
                    <span className="text-sm font-bold text-indigo-400 font-mono">
                      {overview.inventory_analytics.recommended_transfer_units} units
                    </span>
                  </div>
                </div>

                {/* 5-Store Distribution Table / Visualization */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Store-by-Store Stock Breakdown
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {overview.inventory_analytics.store_breakdown.map((store) => {
                      const percentage = Math.min(100, Math.round((store.stock / 100) * 100));
                      return (
                        <div
                          key={store.store_id}
                          className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="w-64 space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-white">{store.store_name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({store.store_id})</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Format: {store.format} · Region: {store.region}
                            </div>
                          </div>

                          {/* Stock bar */}
                          <div className="flex-1 max-w-md">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-slate-400">Current Stock:</span>
                              <span
                                className={`font-mono font-bold ${
                                  store.stock <= 2
                                    ? "text-rose-400"
                                    : store.stock > 50
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {store.stock} units
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  store.stock <= 2
                                    ? "bg-rose-500"
                                    : store.stock > 50
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.max(5, percentage)}%` }}
                              />
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="w-28 text-right shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                store.status === "critical_low"
                                  ? "bg-rose-950 text-rose-300 border border-rose-800"
                                  : store.status === "surplus"
                                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                                  : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              }`}
                            >
                              {store.status === "critical_low"
                                ? "CRITICAL LOW"
                                : store.status === "surplus"
                                ? "EXCESS SURPLUS"
                                : "HEALTHY"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grounded Action Card */}
                <div className="p-4 bg-indigo-950/20 border border-indigo-900/60 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
                    <span>📦</span>
                    <span>Inter-Store Rebalancing Recommendation</span>
                  </div>
                  <p className="text-xs text-slate-200">
                    {overview.inventory_analytics.transfer_recommendation.action}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {overview.inventory_analytics.transfer_recommendation.rationale}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: RETURN INTELLIGENCE */}
          {activeSubSection === "returns" && (
            <div className="space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white">Return Intelligence & Defect Root Causes</span>
                      <span className="text-[11px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800 font-mono">
                        reviews_returns.csv
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Catalog Total: {overview.return_analytics.catalog_total_returns} returns out of {overview.return_analytics.catalog_total_reviews} reviews ({overview.return_analytics.catalog_overall_return_rate_pct}%). Explicit Denominator: verified orders/reviews.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      onTriggerInvestigation(
                        "Investigate high customer returns and defect complaints on jacket",
                        "PROD-0006"
                      )
                    }
                    className="px-3.5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-sm shadow-indigo-600/30 flex items-center space-x-1.5"
                  >
                    <span>🔍</span>
                    <span>Launch Return Investigation</span>
                  </button>
                </div>

                {/* Flagged Anomaly Card: PROD-0006 */}
                {overview.return_analytics.flagged_product && (
                  <div className="p-5 bg-rose-950/20 border border-rose-900/60 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">⚠️</span>
                        <div>
                          <h4 className="text-sm font-bold text-rose-300">
                            Critical Sizing Defect: {overview.return_analytics.flagged_product.product_name}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            SKU: {overview.return_analytics.flagged_product.product_id} · Category: {overview.return_analytics.flagged_product.category}
                          </span>
                        </div>
                      </div>
                      <span className="bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold text-xs px-2.5 py-1 rounded">
                        {overview.return_analytics.flagged_product.return_rate_pct}% Return Rate
                      </span>
                    </div>

                    {/* Denominator & Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Explicit Denominator</span>
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {overview.return_analytics.flagged_product.returns_count_numerator} Returns / {overview.return_analytics.flagged_product.total_reviews_denominator} Total Reviews
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sizing Complaint Share</span>
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {overview.return_analytics.flagged_product.sizing_issues_count} of {overview.return_analytics.flagged_product.returns_count_numerator} ({overview.return_analytics.flagged_product.sizing_share_of_returns_pct}%)
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Customer Rating</span>
                        <span className="text-xs font-mono font-bold text-rose-400">
                          {overview.return_analytics.flagged_product.average_rating}★ / 5.0★
                        </span>
                      </div>
                    </div>

                    {/* Customer Voice Quotes */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-400">Voice of Customer (reviews_returns.csv):</span>
                      <div className="space-y-1">
                        {overview.return_analytics.flagged_product.customer_quotes.map((quote, idx) => (
                          <div key={idx} className="p-2 bg-slate-950/70 border border-slate-800/80 rounded text-[11px] text-slate-300 italic">
                            "{quote}"
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Catalog Return Comparison Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Product-by-Product Return Benchmarks
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Product</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Verified Reviews (Denominator)</th>
                          <th className="p-3">Returns (Numerator)</th>
                          <th className="p-3">Return Rate</th>
                          <th className="p-3">Avg Rating</th>
                          <th className="p-3">Primary Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                        {overview.return_analytics.products.map((p) => (
                          <tr key={p.product_id} className={p.status === "critical" ? "bg-rose-950/20" : ""}>
                            <td className="p-3 font-medium text-white">
                              {p.product_name} <span className="text-slate-500 font-mono">({p.product_id})</span>
                            </td>
                            <td className="p-3 text-slate-400">{p.category}</td>
                            <td className="p-3 font-mono text-slate-300">{p.total_reviews_denominator}</td>
                            <td className="p-3 font-mono text-slate-300">{p.returns_count_numerator}</td>
                            <td className="p-3 font-mono font-bold">
                              <span className={p.return_rate_pct >= 50 ? "text-rose-400" : "text-emerald-400"}>
                                {p.return_rate_pct}%
                              </span>
                            </td>
                            <td className="p-3 font-mono text-slate-300">{p.average_rating}★</td>
                            <td className="p-3 text-slate-400">
                              {p.sizing_issues_count > 0 ? "sizing_issue (100%)" : "None / Satisfied"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: NEXT BEST ACTIONS */}
          {activeSubSection === "actions" && (
            <div className="space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-white">Consolidated Decision Queue</span>
                      <span className="text-[11px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800 font-mono">
                        Prioritized Actions
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Multi-agent recommendations awaiting human-in-the-loop validation.
                    </p>
                  </div>

                  <span className="text-[11px] font-mono text-amber-300 bg-amber-950/50 border border-amber-800 px-2.5 py-1 rounded-full">
                    🛡️ Local Simulation Mode
                  </span>
                </div>

                {/* Simulation Disclaimer Alert */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start space-x-2.5">
                  <span className="text-base">ℹ️</span>
                  <div>
                    <strong className="text-slate-200">Human Operator Control Notice:</strong> Approving or rejecting an action updates the local session audit log only. No production ERP, live inventory transfer, or external marketing campaign is dispatched.
                  </div>
                </div>

                {/* Decision Queue Cards */}
                <div className="space-y-3.5">
                  {overview.decision_queue.map((item) => {
                    const currentDecision = decisionsState[item.id]?.status || "proposed";
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition ${
                          currentDecision === "approved"
                            ? "bg-emerald-950/20 border-emerald-800"
                            : currentDecision === "rejected"
                            ? "bg-rose-950/20 border-rose-800"
                            : "bg-slate-950 border-slate-800"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                                {item.category}
                              </span>
                              <span className="text-xs font-bold text-white">{item.agent}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({item.id})</span>
                              {currentDecision !== "proposed" && (
                                <span
                                  className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase ${
                                    currentDecision === "approved"
                                      ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                                      : "bg-rose-950 text-rose-300 border border-rose-700"
                                  }`}
                                >
                                  {currentDecision} (Simulation)
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-medium text-slate-100">{item.action}</p>
                            <p className="text-[11px] text-slate-400">{item.rationale}</p>
                            <div className="flex items-center space-x-4 text-[10px] text-slate-500 font-mono">
                              <span>Impact: {item.expected_impact}</span>
                              <span>·</span>
                              <span>Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                              <span>·</span>
                              <span>Source: {item.supporting_evidence_source}</span>
                            </div>
                          </div>

                          {/* Decision Controls */}
                          <div className="flex items-center space-x-2 shrink-0">
                            {currentDecision === "proposed" ? (
                              <>
                                <button
                                  onClick={() => handleDecision(item, "approved")}
                                  className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm shadow-emerald-600/30 transition flex items-center space-x-1"
                                >
                                  <span>✓</span>
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleDecision(item, "rejected")}
                                  className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg border border-slate-700 transition flex items-center space-x-1"
                                >
                                  <span>✕</span>
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleResetDecision(item.id)}
                                className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded border border-slate-700 transition"
                              >
                                Reset Choice
                              </button>
                            )}

                            <button
                              onClick={() =>
                                onTriggerInvestigation(item.investigation_query, item.target_product_id)
                              }
                              className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg border border-slate-700 transition"
                            >
                              Deep Inspect ↗
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Audit Log Drawer */}
                {auditLog.length > 0 && (
                  <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>Local Session Decision Audit Log</span>
                      <span className="text-[10px] text-slate-500 font-mono">{auditLog.length} recorded</span>
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                      {auditLog.map((log, idx) => (
                        <div key={idx} className="text-[11px] flex items-center justify-between p-1.5 bg-slate-900/60 rounded border border-slate-800 font-mono">
                          <span className="text-slate-400">
                            [{log.timestamp}] {log.id}: {log.action.slice(0, 50)}...
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold uppercase text-[10px] ${
                              log.status === "approved" ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
