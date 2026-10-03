"use client";

import { useEffect, useState } from "react";

interface SystemStatus {
  name?: string;
  version?: string;
  status?: string;
  environment?: string;
  modules?: Record<string, string>;
  timestamp?: string;
}

export default function Home() {
  const [systemInfo, setSystemInfo] = useState<SystemStatus | null>(null);
  const [backendHealth, setBackendHealth] = useState<string>("checking...");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function checkBackend() {
      try {
        const healthRes = await fetch(`${apiUrl}/health`);
        if (healthRes.ok) {
          setBackendHealth("online");
        } else {
          setBackendHealth("unhealthy");
        }

        const sysRes = await fetch(`${apiUrl}/api/v1/system`);
        if (sysRes.ok) {
          const data = await sysRes.json();
          setSystemInfo(data);
        }
      } catch (err) {
        setBackendHealth("offline");
      }
    }
    checkBackend();
  }, [apiUrl]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            RQ
          </div>
          <span className="text-xl font-bold tracking-tight">RetailIQ</span>
          <span className="text-xs bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded-full font-medium">
            v0.1.0 Foundation
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Backend:</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
              backendHealth === "online"
                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                : backendHealth === "checking..."
                ? "bg-amber-950 text-amber-400 border border-amber-800"
                : "bg-rose-950 text-rose-400 border border-rose-800"
            }`}
          >
            ● {backendHealth.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-8 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Retail Intelligence & Investigation Platform
          </h1>
          <p className="text-slate-400 max-w-2xl text-base leading-relaxed">
            An investigation and decision layer connecting customer behavior, store operations, and business intelligence.
          </p>
        </div>

        {/* Investigation Loop Diagram */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Core Investigation Loop
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
            {[
              "1. Signal",
              "2. Context",
              "3. Investigation",
              "4. Evidence",
              "5. Explanation",
              "6. Recommendation",
              "7. Human Decision",
            ].map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2.5 font-medium text-slate-200"
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Domain Overview Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Customer Intelligence */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-white">Customer Intelligence</h3>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Domain 1</span>
            </div>
            <p className="text-sm text-slate-400">
              Natural-language discovery, smart product substitutions, friction detection, and lost-sale diagnosis.
            </p>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li>• Product Discovery Agent</li>
              <li>• Smart Substitution Agent</li>
              <li>• Customer Friction Agent</li>
              <li>• Lost Sale Investigation Agent</li>
              <li>• Customer Context Agent</li>
            </ul>
          </div>

          {/* Retail / Business Intelligence */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg text-white">Retail Intelligence</h3>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Domain 2</span>
            </div>
            <p className="text-sm text-slate-400">
              Sales decomposition, store diagnostics, return patterns, supply-demand balancing, and next-best actions.
            </p>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li>• Retail Command Center Agent</li>
              <li>• Sales Investigation Agent</li>
              <li>• Supply-Demand Intelligence Agent</li>
              <li>• Return Intelligence Agent</li>
              <li>• Next-Best-Action Agent</li>
            </ul>
          </div>
        </div>

        {/* System Diagnostics / Backend Verification */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            System Diagnostics & Connectivity
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-1">
              <div className="text-slate-500">API Endpoint</div>
              <div className="font-mono text-slate-300 truncate">{apiUrl}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-1">
              <div className="text-slate-500">System Status</div>
              <div className="font-mono text-emerald-400">
                {systemInfo?.status || (backendHealth === "online" ? "ready" : "offline")}
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-1">
              <div className="text-slate-500">API Docs</div>
              <div>
                <a
                  href={`${apiUrl}/docs`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline font-mono"
                >
                  {apiUrl}/docs ↗
                </a>
              </div>
            </div>
          </div>
          {systemInfo?.modules && (
            <div className="text-xs pt-2">
              <span className="text-slate-500">Registered Modules: </span>
              <span className="font-mono text-slate-300">
                {Object.keys(systemInfo.modules).join(", ")}
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 px-8 text-center text-xs text-slate-500">
        RetailIQ · AI Builder Cup 2026 · Foundation Increment
      </footer>
    </div>
  );
}
