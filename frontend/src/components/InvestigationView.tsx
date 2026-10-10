"use client";

import React, { useState } from "react";
import { InvestigationRequest, InvestigationResponse, AgentResult, Evidence, Recommendation } from "@/types/intelligence";

interface InvestigationViewProps {
  initialQuery?: string;
  initialProductId?: string;
  initialCustomerId?: string;
  apiUrl: string;
  backendHealth?: "online" | "checking..." | "offline";
}

interface ActionDecision {
  status: "approved" | "rejected" | "investigating_further";
  timestamp: string;
  actionText: string;
  agent: string;
  rationale: string;
}

export function InvestigationView({
  initialQuery = "",
  initialProductId = "",
  initialCustomerId = "",
  apiUrl,
  backendHealth = "checking...",
}: InvestigationViewProps) {
  const [query, setQuery] = useState(initialQuery);
  const [productId, setProductId] = useState(initialProductId);
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<InvestigationResponse | null>(null);
  const [decisions, setDecisions] = useState<Record<string, ActionDecision>>({});

  const presetQueries = [
    {
      title: "Cart Abandonment (Price Mismatch)",
      q: "Investigate checkout abandonment on running shoes for customer CUST-0003",
      pid: "PROD-0004",
      cid: "CUST-0003",
    },
    {
      title: "Stockout & Network Imbalance",
      q: "Investigate inventory imbalance and stockout risk across retail stores",
      pid: "PROD-0001",
      cid: "",
    },
    {
      title: "Sales Drop Post-Campaign",
      q: "Why did sales drop for seamless training tee after the campaign ended?",
      pid: "PROD-0005",
      cid: "",
    },
    {
      title: "High Returns & Sizing Defect",
      q: "Investigate high customer returns and defect complaints on jacket",
      pid: "PROD-0006",
      cid: "",
    },
    {
      title: "Unsupported Query Check",
      q: "What is the weather forecast in Tokyo tomorrow?",
      pid: "",
      cid: "",
    },
  ];

  const handleExecute = async (overrideQ?: string, overridePid?: string, overrideCid?: string) => {
    const activeQuery = overrideQ !== undefined ? overrideQ : query;
    const activePid = overridePid !== undefined ? overridePid : productId;
    const activeCid = overrideCid !== undefined ? overrideCid : customerId;

    if (!activeQuery.trim()) {
      setError("Please enter a non-empty investigation query.");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const payload: InvestigationRequest = {
        query: activeQuery.trim(),
        product_id: activePid.trim() || null,
        customer_id: activeCid.trim() || null,
      };

      const res = await fetch(`${apiUrl}/api/v1/investigations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.detail?.message || `HTTP ${res.status}: Failed to execute investigation.`);
      }

      const data: InvestigationResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(
        err?.message?.includes("Failed to fetch") || err?.name === "TypeError"
          ? `Backend API unreachable at ${apiUrl}. Make sure the FastAPI backend is running.`
          : err?.message || "An unexpected error occurred during investigation."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetDecision = (
    key: string,
    decisionType: "approved" | "rejected" | "investigating_further",
    rec: Recommendation,
    agentName: string
  ) => {
    setDecisions((prev) => {
      // Toggle off if clicking the same decision
      if (prev[key]?.status === decisionType) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: {
          status: decisionType,
          timestamp: new Date().toLocaleTimeString(),
          actionText: rec.action,
          agent: agentName,
          rationale: rec.rationale,
        },
      };
    });
  };

  const decisionCount = Object.keys(decisions).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Backend Offline Advisory */}
      {backendHealth === "offline" && (
        <div className="rounded-xl border border-amber-800 bg-amber-950/40 p-4 text-xs text-amber-200 flex items-start space-x-3">
          <span className="text-base">⚠️</span>
          <div className="space-y-1">
            <div className="font-bold text-amber-400">Backend API Offline Warning</div>
            <p className="text-amber-200/90">
              The backend service is not responding at <code className="bg-amber-900/60 px-1 py-0.5 rounded font-mono">{apiUrl}</code>.
              Run <code className="bg-amber-900/60 px-1 py-0.5 rounded font-mono">python -m uvicorn backend.app.main:app --port 8000</code> in your terminal to enable live investigations.
            </p>
          </div>
        </div>
      )}

      {/* Header & Query Input Form */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold mb-2">
              <span>🔬</span>
              <span>Deterministic Investigation Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Investigate Retail Signals & Anomalies
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Submit shopping intent or operational KPI queries. Evidence is derived strictly from local CSV datasets without generative hallucinations.
            </p>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="self-start sm:self-auto text-xs text-indigo-400 hover:text-indigo-300 underline font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? "Hide Context Identifiers ▲" : "Set Context Identifiers ▼"}
          </button>
        </div>

        {/* Query Input */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask RetailIQ (e.g., 'Investigate checkout abandonment on running shoes for customer CUST-0003')..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExecute();
                  if (e.key === "Escape") setQuery("");
                }}
                aria-label="Investigation query"
              />
            </div>
            <button
              onClick={() => handleExecute()}
              disabled={loading || !query.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center space-x-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Investigating...</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Investigate</span>
                </>
              )}
            </button>
          </div>

          {/* Optional context IDs */}
          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Customer ID Context (optional):</label>
                <input
                  type="text"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  placeholder="e.g., CUST-0003"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Product ID Context (optional):</label>
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="e.g., PROD-0004"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Verified Dataset Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              {presetQueries.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(p.q);
                    setProductId(p.pid);
                    setCustomerId(p.cid);
                    handleExecute(p.q, p.pid, p.cid);
                  }}
                  className="px-2.5 py-1 rounded text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-base font-bold text-white">Analyzing local retail telemetry...</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Computing deterministic metrics across customer orders, inventory stock, and return logs without speculative generation.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-xl border border-rose-800 bg-rose-950/40 p-6 space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
            <span>⚠️</span>
            <span>Investigation Error</span>
          </div>
          <p className="text-xs text-rose-200">{error}</p>
          <div className="pt-1">
            <button
              onClick={() => handleExecute()}
              className="px-3.5 py-1.5 bg-rose-900/80 hover:bg-rose-800 border border-rose-700 text-rose-100 rounded text-xs font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-rose-400"
            >
              Retry Investigation
            </button>
          </div>
        </div>
      )}

      {/* Results State */}
      {response && !loading && (
        <div className="space-y-6">
          {/* Status & Summary Header */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-indigo-400 font-semibold">
                  {response.investigation_id}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Status: {response.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center space-x-3">
                {response.metadata?.execution_time_ms !== undefined && (
                  <span>⏱️ {response.metadata.execution_time_ms} ms</span>
                )}
                <span>📅 {new Date(response.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Unsupported Query Banner */}
            {response.findings.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950 border border-amber-900/60 space-y-3 text-amber-200">
                <div className="flex items-center space-x-2 font-bold text-sm text-amber-400">
                  <span>ℹ️</span>
                  <span>No Direct Scenario Match</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                  {response.summary}
                </p>
                {response.metadata?.supported_scenarios && (
                  <div className="text-xs pt-2 border-t border-slate-900">
                    <span className="font-semibold text-slate-400">Supported Investigations:</span>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                      {response.metadata.supported_scenarios.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Synthesized Investigation Summary:
                </span>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 font-medium">
                  {response.summary}
                </p>
              </div>
            )}
          </div>

          {/* Specialist Agent Findings List */}
          {response.findings.map((finding, idx) => (
            <AgentFindingCard
              key={idx}
              finding={finding}
              decisions={decisions}
              onSetDecision={handleSetDecision}
            />
          ))}

          {/* Operator Decision Audit Log Banner */}
          {decisionCount > 0 && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">📋</span>
                  <h4 className="text-sm font-bold text-white">
                    Operator Decision Audit Log ({decisionCount} Logged in Session)
                  </h4>
                </div>
                <span className="text-[11px] text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded">
                  Simulation Staging Mode — No External ERP Actions Dispatched
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {Object.entries(decisions).map(([key, item]) => (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            item.status === "approved"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : item.status === "rejected"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : "bg-indigo-950 text-indigo-300 border border-indigo-800"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                        <span className="font-semibold text-white">{item.actionText}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.agent} · <span className="text-slate-500 font-mono">{item.timestamp}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 italic">
                      Status: Local State Modified
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

interface AgentFindingCardProps {
  finding: AgentResult;
  decisions: Record<string, ActionDecision>;
  onSetDecision: (
    key: string,
    decision: "approved" | "rejected" | "investigating_further",
    rec: Recommendation,
    agent: string
  ) => void;
}

function AgentFindingCard({ finding, decisions, onSetDecision }: AgentFindingCardProps) {
  const confidencePct = Math.round(finding.confidence * 100);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 shadow-lg">
      {/* Agent Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">
            Specialist Agent
          </span>
          <h3 className="text-lg font-bold text-white">{finding.agent}</h3>
        </div>

        {/* Confidence Meter */}
        <div className="flex items-center space-x-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400">Confidence:</span>
          <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full ${
                confidencePct >= 90
                  ? "bg-emerald-500"
                  : confidencePct >= 75
                  ? "bg-indigo-500"
                  : "bg-amber-500"
              }`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-white">{confidencePct}%</span>
        </div>
      </div>

      {/* Synthesized Finding */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Root Cause & Finding:
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed">{finding.finding}</p>
      </div>

      {/* Verified Evidence Layer */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Verified Evidence ({finding.evidence.length} Items):</span>
          <span className="text-[11px] text-emerald-400">✓ Deterministic calculations</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {finding.evidence.map((ev, eIdx) => (
            <EvidenceCard key={eIdx} evidence={ev} />
          ))}
        </div>
      </div>

      {/* Recommendations & Action Queue */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Recommended Actions for Human Decision:
        </h4>
        <div className="space-y-3">
          {finding.recommendations.map((rec, rIdx) => {
            const actionKey = `${finding.agent}_${rIdx}`;
            const currentDecision = decisions[actionKey];

            return (
              <div
                key={rIdx}
                className={`p-4 rounded-xl border transition-all ${
                  currentDecision?.status === "approved"
                    ? "bg-emerald-950/30 border-emerald-800 shadow-sm"
                    : currentDecision?.status === "rejected"
                    ? "bg-rose-950/30 border-rose-800 opacity-60"
                    : currentDecision?.status === "investigating_further"
                    ? "bg-indigo-950/30 border-indigo-800"
                    : "bg-slate-950 border-slate-800"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          rec.priority === "HIGH"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : rec.priority === "MEDIUM"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {rec.priority} PRIORITY
                      </span>

                      {/* State distinction badge */}
                      {currentDecision ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            currentDecision.status === "approved"
                              ? "bg-emerald-900 text-emerald-200 border border-emerald-700"
                              : currentDecision.status === "rejected"
                              ? "bg-rose-900 text-rose-200 border border-rose-700"
                              : "bg-indigo-900 text-indigo-200 border border-indigo-700"
                          }`}
                        >
                          DECISION: {currentDecision.status.toUpperCase().replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          PROPOSED RECOMMENDATION · Awaiting Review
                        </span>
                      )}

                      <h5 className="font-bold text-sm text-white">{rec.action}</h5>
                    </div>

                    <p className="text-xs text-slate-300">
                      <span className="text-slate-500 font-semibold">Rationale: </span>
                      {rec.rationale}
                    </p>
                    <p className="text-xs text-indigo-300">
                      <span className="text-slate-500 font-semibold">Expected Impact: </span>
                      {rec.expected_impact}
                    </p>

                    {/* Simulation Notice when approved */}
                    {currentDecision?.status === "approved" && (
                      <p className="text-[11px] text-emerald-400 pt-1 font-medium">
                        ✓ Action approved in local session audit log. Real warehouse/ERP execution is not dispatched in demonstration mode.
                      </p>
                    )}
                  </div>

                  {/* Decision Controls */}
                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => onSetDecision(actionKey, "approved", rec, finding.agent)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-emerald-400 ${
                        currentDecision?.status === "approved"
                          ? "bg-emerald-600 text-white shadow"
                          : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-emerald-700 hover:text-emerald-300"
                      }`}
                    >
                      {currentDecision?.status === "approved" ? "✓ Approved" : "Approve"}
                    </button>

                    <button
                      onClick={() => onSetDecision(actionKey, "rejected", rec, finding.agent)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-rose-400 ${
                        currentDecision?.status === "rejected"
                          ? "bg-rose-600 text-white shadow"
                          : "bg-slate-900 text-slate-300 border border-slate-800 hover:border-rose-700 hover:text-rose-300"
                      }`}
                    >
                      {currentDecision?.status === "rejected" ? "✕ Rejected" : "Reject"}
                    </button>

                    <button
                      onClick={() => onSetDecision(actionKey, "investigating_further", rec, finding.agent)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                        currentDecision?.status === "investigating_further"
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                      }`}
                      title="Mark as requiring deeper investigation"
                    >
                      Hold / Deep Dive
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sources Footer */}
      <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
        <span>Referenced Dataset Sources:</span>
        {finding.sources.map((src, sIdx) => (
          <span
            key={sIdx}
            className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-400"
          >
            {src}
          </span>
        ))}
      </div>
    </div>
  );
}

function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const typeColors: Record<string, string> = {
    metric: "bg-blue-950/80 text-blue-300 border-blue-800",
    data_point: "bg-purple-950/80 text-purple-300 border-purple-800",
    event: "bg-amber-950/80 text-amber-300 border-amber-800",
    retrieval: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2 flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
              typeColors[evidence.type] || "bg-slate-900 text-slate-400"
            }`}
          >
            {evidence.type.replace("_", " ")}
          </span>
          <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
            {evidence.source}
          </span>
        </div>
        <div className="font-semibold text-xs text-white">{evidence.label}</div>
      </div>

      {/* Formatted Evidence Value */}
      <div className="bg-slate-900/90 rounded-lg p-2.5 text-xs font-mono text-slate-200 border border-slate-800/80 overflow-x-auto max-h-32">
        {typeof evidence.value === "object" ? (
          Array.isArray(evidence.value) ? (
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {evidence.value.map((v, idx) => (
                <li key={idx} className="truncate">
                  {typeof v === "string" ? `"${v}"` : JSON.stringify(v)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-1 text-[11px]">
              {Object.entries(evidence.value).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-slate-400 font-sans">{k}:</span>
                  <span className="font-semibold text-indigo-300 truncate">
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          )
        ) : (
          <span className="text-sm font-bold text-indigo-300">{String(evidence.value)}</span>
        )}
      </div>
    </div>
  );
}
