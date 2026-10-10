"use client";

import React from "react";

export type NavTab = "discovery" | "investigations" | "substitutions" | "friction" | "retail";

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  backendHealth: "online" | "checking..." | "offline";
}

export function Navbar({ activeTab, onTabChange, backendHealth }: NavbarProps) {
  const tabs: { id: NavTab; label: string; icon: string; count?: string }[] = [
    { id: "discovery", label: "Product Discovery", icon: "🛍️" },
    { id: "retail", label: "Retail Workspace", icon: "🏢", count: "Command" },
    { id: "investigations", label: "Investigation Engine", icon: "🔍", count: "Live" },
    { id: "substitutions", label: "Smart Substitution", icon: "🔄", count: "2 Cases" },
    { id: "friction", label: "Customer Friction", icon: "⚠️", count: "3 Alerts" },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange("discovery")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
              RQ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">RetailIQ</span>
                <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded-full font-medium">
                  Intelligence Layer
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Customer & Retail Intelligence Platform</p>
            </div>
          </div>

          {/* Mobile Backend Status */}
          <div className="flex md:hidden items-center space-x-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                backendHealth === "online"
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                  : backendHealth === "checking..."
                  ? "bg-amber-950/80 text-amber-300 border-amber-800"
                  : "bg-rose-950/80 text-rose-300 border-rose-800"
              }`}
            >
              ● {backendHealth.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-indigo-800 text-indigo-200" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop API status */}
        <div className="hidden md:flex items-center space-x-2.5 text-xs text-slate-400">
          <span className="text-slate-500">API:</span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
              backendHealth === "online"
                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                : backendHealth === "checking..."
                ? "bg-amber-950 text-amber-400 border-amber-800"
                : "bg-rose-950 text-rose-400 border-rose-800"
            }`}
          >
            ● {backendHealth.toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}
