"use client";

import React, { useState, useMemo } from "react";
import { PRODUCTS_CATALOG } from "@/data/catalog";
import { Product } from "@/types/intelligence";

interface DiscoveryViewProps {
  onTriggerInvestigation: (query: string, productId?: string, customerId?: string) => void;
  onSelectSubstitution: (productId: string) => void;
  onSelectFriction: (productId: string) => void;
}

export function DiscoveryView({
  onTriggerInvestigation,
  onSelectSubstitution,
  onSelectFriction,
}: DiscoveryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Footwear", "Apparel", "Fitness & Gear"];

  const suggestedQueries = [
    { label: "🏃 Black running shoes under ₹4,000", query: "black running shoes under 4000", isFilter: true },
    { label: "⚠️ Cart abandonment on elite road shoes", query: "Investigate checkout abandonment on running shoes for customer CUST-0003", prodId: "PROD-0004", custId: "CUST-0003" },
    { label: "🔄 Substitute for out-of-stock trail shoes", query: "Find substitute for out-of-stock trail shoes", prodId: "PROD-0002", isSub: true },
    { label: "📉 Sales decline on training tees", query: "Why did sales drop for seamless training tee after the campaign ended?", prodId: "PROD-0005" },
    { label: "📦 Cross-store stockout & imbalance", query: "Investigate inventory imbalance and stockout risk across retail stores", prodId: "PROD-0001" },
    { label: "↩️ High returns on packable jacket", query: "Investigate high customer returns and defect complaints on jacket", prodId: "PROD-0006", isFric: true },
  ];

  const filteredProducts = useMemo(() => {
    return PRODUCTS_CATALOG.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();

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
      const haystack = `${product.product_name} ${product.brand} ${product.subcategory} ${product.category} ${product.description} ${product.product_id} ${product.attributes.color || ""}`.toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });
  }, [searchQuery, selectedCategory]);

  const handleSuggestedClick = (item: (typeof suggestedQueries)[0]) => {
    if (item.isSub && item.prodId) {
      onSelectSubstitution(item.prodId);
    } else if (item.isFric && item.prodId) {
      onSelectFriction(item.prodId);
    } else if (item.isFilter) {
      setSearchQuery(item.query);
      setSelectedCategory("All");
    } else {
      onTriggerInvestigation(item.query, item.prodId, item.custId);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Search Section */}
      <section className="relative rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/50 to-slate-950 p-6 sm:p-10 shadow-xl space-y-6">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
            <span>✨</span>
            <span>Customer Intelligence & Product Discovery</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Discover catalog items backed by live retail evidence
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Search products using natural-language intent or inspect active signals across inventory balance, pricing sensitivity, and customer friction.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-3xl">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-400 text-lg">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, product ID, or query (e.g., 'black running shoes under 4000', 'PROD-0002')..."
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-12 pr-24 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 px-2 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-md"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Suggested Queries */}
        <div className="space-y-2 max-w-4xl">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Suggested Investigations & Queries:
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQueries.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedClick(item)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-indigo-950 hover:text-indigo-200 border border-slate-700/60 hover:border-indigo-700/80 text-slate-300 transition-all text-left"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Merchandising & Filters Bar */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-semibold text-white">{filteredProducts.length}</span> verified catalog products
        </div>
      </section>

      {/* Catalog Grid */}
      <section>
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 p-12 text-center space-y-4">
            <div className="text-4xl">🔎</div>
            <h3 className="text-lg font-bold text-white">No products matched your search</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              We couldn't find items matching "{searchQuery}". Try clearing filters or searching for general terms like "shoes", "jacket", or "PulseWear".
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onInvestigate={() =>
                  onTriggerInvestigation(
                    `Investigate telemetry and performance for product ${product.product_id}`,
                    product.product_id
                  )
                }
                onSubstitution={() => onSelectSubstitution(product.product_id)}
                onFriction={() => onSelectFriction(product.product_id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onInvestigate: () => void;
  onSubstitution: () => void;
  onFriction: () => void;
}

function ProductCard({ product, onInvestigate, onSubstitution, onFriction }: ProductCardProps) {
  const isOutOfStock = product.statusBadge === "out_of_stock";
  const isLowStock = product.statusBadge === "low_stock";
  const isDefect = product.statusBadge === "high_return_rate";
  const isPremium = product.price > 5000;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700/80 transition-all flex flex-col justify-between overflow-hidden shadow-lg group">
      <div className="p-5 space-y-3.5">
        {/* Card Header & Badges */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
            {product.product_id}
          </span>

          {product.badgeText && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isOutOfStock
                  ? "bg-rose-950/80 text-rose-300 border-rose-800"
                  : isDefect
                  ? "bg-amber-950/80 text-amber-300 border-amber-800"
                  : isLowStock
                  ? "bg-amber-950/70 text-amber-200 border-amber-700"
                  : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
              }`}
            >
              {product.badgeText}
            </span>
          )}
        </div>

        {/* Title & Brand */}
        <div>
          <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
            {product.brand} · {product.subcategory}
          </div>
          <h3 className="font-bold text-base text-white group-hover:text-indigo-200 transition-colors line-clamp-1">
            {product.product_name}
          </h3>
        </div>

        {/* Price & Rating */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="text-xl font-extrabold text-white">
            ₹{product.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-amber-400">
            <span>★</span>
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-slate-500 font-normal">/5.0</span>
          </div>
        </div>

        {/* Attributes pills */}
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {product.attributes.color && (
            <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
              Color: {product.attributes.color}
            </span>
          )}
          {product.attributes.sizes && (
            <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
              Sizes: {product.attributes.sizes.slice(0, 3).join(", ")}
            </span>
          )}
          {product.attributes.plate && (
            <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
              Plate: {product.attributes.plate}
            </span>
          )}
          {product.attributes.waterproof && (
            <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
              {product.attributes.waterproof}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
          {product.description}
        </p>
      </div>

      {/* Card Actions Footer */}
      <div className="border-t border-slate-800/80 bg-slate-950/40 p-3.5 flex flex-wrap items-center gap-2">
        {isOutOfStock ? (
          <button
            onClick={onSubstitution}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all text-center"
          >
            🔄 Find Substitutes
          </button>
        ) : isDefect ? (
          <button
            onClick={onFriction}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all text-center"
          >
            ⚠️ Inspect Defect Telemetry
          </button>
        ) : isPremium ? (
          <button
            onClick={onInvestigate}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-center"
          >
            🔍 Analyze Price Sensitivity
          </button>
        ) : (
          <button
            onClick={onInvestigate}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-center"
          >
            🔍 Run Investigation
          </button>
        )}

        <button
          onClick={onSubstitution}
          title="Compare alternatives"
          className="py-1.5 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all"
        >
          Compare
        </button>
      </div>
    </div>
  );
}
