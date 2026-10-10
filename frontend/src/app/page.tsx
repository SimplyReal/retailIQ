"use client";

import React, { useState, useEffect } from "react";
import { Navbar, NavTab } from "@/components/Navbar";
import { DiscoveryView } from "@/components/DiscoveryView";
import { InvestigationView } from "@/components/InvestigationView";
import { SubstitutionView } from "@/components/SubstitutionView";
import { FrictionView } from "@/components/FrictionView";
import { RetailWorkspaceView } from "@/components/RetailWorkspaceView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("discovery");
  const [backendHealth, setBackendHealth] = useState<"online" | "checking..." | "offline">("checking...");

  // Context passed between tabs
  const [investigationContext, setInvestigationContext] = useState<{
    query: string;
    productId?: string;
    customerId?: string;
  }>({
    query: "Investigate checkout abandonment on running shoes for customer CUST-0003",
    productId: "PROD-0004",
    customerId: "CUST-0003",
  });

  const [substitutionTargetId, setSubstitutionTargetId] = useState<string>("PROD-0002");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) {
          setBackendHealth("online");
        } else {
          setBackendHealth("offline");
        }
      } catch {
        setBackendHealth("offline");
      }
    }
    checkHealth();
  }, [apiUrl]);

  const handleTriggerInvestigation = (query: string, productId?: string, customerId?: string) => {
    setInvestigationContext({ query, productId, customerId });
    setActiveTab("investigations");
  };

  const handleSelectSubstitution = (productId: string) => {
    setSubstitutionTargetId(productId);
    setActiveTab("substitutions");
  };

  const handleSelectFriction = (productId: string) => {
    setActiveTab("friction");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        backendHealth={backendHealth}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {activeTab === "discovery" && (
          <DiscoveryView
            onTriggerInvestigation={handleTriggerInvestigation}
            onSelectSubstitution={handleSelectSubstitution}
            onSelectFriction={handleSelectFriction}
          />
        )}

        {activeTab === "investigations" && (
          <InvestigationView
            initialQuery={investigationContext.query}
            initialProductId={investigationContext.productId}
            initialCustomerId={investigationContext.customerId}
            apiUrl={apiUrl}
            backendHealth={backendHealth}
          />
        )}

        {activeTab === "substitutions" && (
          <SubstitutionView
            initialProductId={substitutionTargetId}
            onTriggerInvestigation={handleTriggerInvestigation}
          />
        )}

        {activeTab === "friction" && (
          <FrictionView
            onTriggerInvestigation={handleTriggerInvestigation}
            onNavigateSubstitution={handleSelectSubstitution}
          />
        )}

        {activeTab === "retail" && (
          <RetailWorkspaceView
            apiUrl={apiUrl}
            backendHealth={backendHealth}
            onTriggerInvestigation={handleTriggerInvestigation}
          />
        )}
      </main>

      {/* Product Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 sm:px-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="font-semibold text-slate-400">RetailIQ</span>
            <span>· AI Builder Cup 2026 · Local Investigation Layer</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>Signal → Context → Investigation → Evidence → Explanation → Action</span>
            <a
              href={`${apiUrl}/docs`}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-mono"
            >
              API Docs ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
