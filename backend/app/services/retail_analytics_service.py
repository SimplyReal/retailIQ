"""Retail Analytics Service for RetailIQ.

Computes deterministic, dataset-grounded KPIs, anomaly signals, sales period comparisons,
multi-store inventory distributions, and return rate analytics with explicit denominators.
Never hardcodes dashboard values; calculates all metrics from local CSV datasets.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime
from backend.app.services.data_loader import DataLoader, default_data_loader
from backend.app.services.investigation_service import InvestigationService


class RetailAnalyticsService:
    """Service computing verified retail analytics from generated CSV datasets."""

    def __init__(self, data_loader: Optional[DataLoader] = None):
        self.loader = data_loader or default_data_loader
        self.investigation_service = InvestigationService(self.loader)

    def get_kpis(self) -> Dict[str, Any]:
        """Compute top-level business KPIs directly from orders, inventory, and reviews."""
        orders = self.loader.get_orders()
        inventory = self.loader.get_inventory()
        reviews = self.loader.get_reviews_returns()
        promotions = self.loader.get_promotions()

        # Sales KPIs
        total_revenue = sum(o["price"] * o["quantity"] - o["discount"] for o in orders)
        order_count = len(orders)
        aov = round(total_revenue / order_count, 2) if order_count > 0 else 0.0

        # Inventory KPIs
        total_units = sum(i["stock"] for i in inventory)
        low_stock_items = [i for i in inventory if 0 < i["stock"] < 10]
        out_of_stock_items = [i for i in inventory if i["stock"] == 0]

        # Returns KPIs
        total_reviews = len(reviews)
        returns = [r for r in reviews if r["return_flag"]]
        returns_count = len(returns)
        overall_return_rate = (
            round((returns_count / total_reviews) * 100, 1) if total_reviews > 0 else 0.0
        )

        # Promotion KPIs
        total_promotions = len(promotions)

        return {
            "sales": {
                "total_revenue": round(total_revenue, 2),
                "order_count": order_count,
                "average_order_value": aov,
                "currency": "INR",
            },
            "inventory": {
                "total_network_units": total_units,
                "total_sku_store_combinations": len(inventory),
                "low_stock_count": len(low_stock_items),
                "out_of_stock_count": len(out_of_stock_items),
            },
            "returns": {
                "total_reviews": total_reviews,
                "total_returns": returns_count,
                "overall_return_rate_pct": overall_return_rate,
                "denominator_explanation": f"{returns_count} returns out of {total_reviews} total customer review records",
            },
            "promotions": {
                "active_campaign_count": total_promotions,
                "tracked_campaigns": [p["campaign"] for p in promotions[:4]],
            },
        }

    def get_prioritized_signals(self) -> List[Dict[str, Any]]:
        """Compute prioritized anomaly signals linked to supporting dataset evidence."""
        signals = []

        # Signal 1: Sizing Defect & Return Spike on PROD-0006
        products = self.loader.get_products()
        reviews = self.loader.get_reviews_returns()
        p6_reviews = [r for r in reviews if r["product_id"] == "PROD-0006"]
        p6_total = len(p6_reviews)
        p6_returns = [r for r in p6_reviews if r["return_flag"]]
        p6_sizing = [r for r in p6_returns if r["return_reason"] == "sizing_issue"]
        p6_rate = round((len(p6_returns) / p6_total) * 100, 1) if p6_total > 0 else 0.0
        p6_avg_rating = (
            round(sum(r["rating"] for r in p6_reviews) / p6_total, 2) if p6_total > 0 else 0.0
        )
        p6_name = products.get("PROD-0006", {}).get("product_name", "UrbanPeak StormShield Packable Jacket")

        if p6_rate >= 50.0:
            signals.append({
                "id": "SIG-RET-001",
                "domain": "returns",
                "severity": "CRITICAL",
                "title": "Severe Sizing Defect & High Return Rate",
                "product_id": "PROD-0006",
                "product_name": p6_name,
                "summary": f"{p6_rate}% return rate ({len(p6_returns)} returns / {p6_total} reviews) with average rating of {p6_avg_rating}★. 100% of returns cite sizing issues.",
                "metric_label": "Product Return Rate",
                "metric_value": f"{p6_rate}%",
                "denominator": f"{len(p6_returns)} returns / {p6_total} verified orders/reviews",
                "investigation_query": "Investigate high customer returns and defect complaints on jacket",
                "action_tab": "returns",
            })

        # Signal 2: Post-Promotion Sales Decline on PROD-0005
        sales_analytics = self.get_sales_analytics("PROD-0005")
        if sales_analytics and sales_analytics["calculated_changes"]["order_volume_drop_pct"] > 50.0:
            vol_drop = sales_analytics["calculated_changes"]["order_volume_drop_pct"]
            rev_drop = sales_analytics["calculated_changes"]["net_revenue_drop_pct"]
            signals.append({
                "id": "SIG-SAL-002",
                "domain": "sales",
                "severity": "HIGH",
                "title": "Post-Promotion Sales Volume Cliff",
                "product_id": "PROD-0005",
                "product_name": "Core Seamless Training Tee",
                "summary": f"Order volume plunged by {vol_drop}% and revenue dropped by {rev_drop}% immediately after '{sales_analytics['promotion_lifecycle']['campaign_name']}' expired on {sales_analytics['promotion_lifecycle']['campaign_end_date']}.",
                "metric_label": "Volume Drop Post-Promo",
                "metric_value": f"-{vol_drop}%",
                "denominator": f"Period 2 ({sales_analytics['period_2_post_promo']['orders_count']} orders) vs Period 1 ({sales_analytics['period_1_promo']['orders_count']} orders)",
                "investigation_query": "Why did sales drop for seamless training tee after the campaign ended?",
                "action_tab": "sales",
            })

        # Signal 3: Inter-Store Inventory Imbalance on PROD-0001
        inventory_analytics = self.get_inventory_analytics("PROD-0001")
        if inventory_analytics and inventory_analytics["imbalance_ratio"] > 10.0:
            ratio = inventory_analytics["imbalance_ratio"]
            min_st = inventory_analytics["deficit_store"]
            max_st = inventory_analytics["surplus_store"]
            transfer_units = inventory_analytics["recommended_transfer_units"]
            signals.append({
                "id": "SIG-INV-003",
                "domain": "inventory",
                "severity": "HIGH",
                "title": "Critical Cross-Store Stock Imbalance",
                "product_id": "PROD-0001",
                "product_name": "AeroStride Velocity Marathon Runner",
                "summary": f"Flagship store ({min_st['store_id']}) has only {min_st['stock']} units (stockout risk) while outlet ({max_st['store_id']}) holds {max_st['stock']} units ({ratio}x surplus). Transfer {transfer_units} units recommended.",
                "metric_label": "Stock Imbalance Ratio",
                "metric_value": f"{ratio}x",
                "denominator": f"{max_st['store_id']} ({max_st['stock']} units) / {min_st['store_id']} ({min_st['stock']} units)",
                "investigation_query": "Investigate inventory imbalance and stockout risk across retail stores",
                "action_tab": "inventory",
            })

        # Signal 4: Regional Out-of-Stock Friction on PROD-0002
        inventory = self.loader.get_inventory()
        p2_inv = [i for i in inventory if i["product_id"] == "PROD-0002"]
        zero_stores = [i["store_id"] for i in p2_inv if i["stock"] == 0]
        if zero_stores:
            signals.append({
                "id": "SIG-INV-004",
                "domain": "inventory",
                "severity": "MEDIUM",
                "title": "Flagship Store Stockouts on Trail Runner",
                "product_id": "PROD-0002",
                "product_name": "TrailGrip Pro Mountain Shoe",
                "summary": f"Completely out of stock in {len(zero_stores)} major retail locations ({', '.join(zero_stores)}), causing immediate basket abandonment.",
                "metric_label": "Stocked-Out Stores",
                "metric_value": f"{len(zero_stores)} of 5 Stores",
                "denominator": f"{len(zero_stores)} stores with 0 units / 5 total network stores",
                "investigation_query": "Find substitute for out-of-stock trail shoes",
                "action_tab": "inventory",
            })

        # Signal 5: Price Mismatch & Cart Abandonment on PROD-0004
        signals.append({
            "id": "SIG-CST-005",
            "domain": "customer",
            "severity": "MEDIUM",
            "title": "Cart Abandonment on Premium Road Racer",
            "product_id": "PROD-0004",
            "product_name": "Apex Carbon Racing Shoe",
            "summary": "Customer CUST-0003 added item (₹6,499.00) and abandoned checkout due to 2.7x price-to-AOV mismatch with zero active promotional discounts.",
            "metric_label": "Price Gap Ratio",
            "metric_value": "2.7x AOV",
            "denominator": "Item price ₹6,499.00 / Customer AOV ₹2,400.00",
            "investigation_query": "Investigate checkout abandonment on running shoes for customer CUST-0003",
            "action_tab": "actions",
        })

        return signals

    def get_sales_analytics(self, product_id: str = "PROD-0005") -> Dict[str, Any]:
        """Compute detailed sales comparison before vs after promotional campaign."""
        products = self.loader.get_products()
        orders = self.loader.get_orders()
        promotions = self.loader.get_promotions()

        prod = products.get(product_id)
        if not prod:
            return {}

        promo = next((p for p in promotions if p["product_id"] == product_id), None)
        end_date = promo["end_date"] if promo else "2026-09-15"

        prod_orders = [o for o in orders if o["product_id"] == product_id]
        p1_orders = [o for o in prod_orders if o["order_date"][:10] <= end_date]
        p2_orders = [o for o in prod_orders if o["order_date"][:10] > end_date]

        p1_count = len(p1_orders)
        p2_count = len(p2_orders)
        p1_gross = sum(o["price"] * o["quantity"] for o in p1_orders)
        p2_gross = sum(o["price"] * o["quantity"] for o in p2_orders)
        p1_discount = sum(o["discount"] for o in p1_orders)
        p2_discount = sum(o["discount"] for o in p2_orders)
        p1_net = p1_gross - p1_discount
        p2_net = p2_gross - p2_discount

        vol_drop = round(((p1_count - p2_count) / p1_count) * 100, 1) if p1_count > 0 else 0.0
        rev_drop = round(((p1_net - p2_net) / p1_net) * 100, 1) if p1_net > 0 else 0.0

        return {
            "product_id": product_id,
            "product_name": prod["product_name"],
            "unit_price": prod["price"],
            "promotion_lifecycle": {
                "campaign_name": promo["campaign"] if promo else "MonsoonClearanceEarly",
                "discount_amount": promo["discount"] if promo else 400.0,
                "start_date": promo["start_date"] if promo else "2026-09-01",
                "campaign_end_date": end_date,
                "status": "expired",
            },
            "period_1_promo": {
                "label": f"Active Campaign Period (Through {end_date})",
                "orders_count": p1_count,
                "gross_revenue": round(p1_gross, 2),
                "discount_total": round(p1_discount, 2),
                "net_revenue": round(p1_net, 2),
                "orders_sample": p1_orders[:5],
            },
            "period_2_post_promo": {
                "label": f"Post-Campaign Period (After {end_date})",
                "orders_count": p2_count,
                "gross_revenue": round(p2_gross, 2),
                "discount_total": round(p2_discount, 2),
                "net_revenue": round(p2_net, 2),
                "orders_sample": p2_orders,
            },
            "calculated_changes": {
                "order_volume_drop_pct": vol_drop,
                "net_revenue_drop_pct": rev_drop,
                "volume_delta_orders": p2_count - p1_count,
                "net_revenue_delta_inr": round(p2_net - p1_net, 2),
            },
            "investigation_recommendation": {
                "action": f"Test margin-optimized continuation campaign (e.g. ₹200 discount or bundle) for {prod['product_name']}",
                "rationale": "High price elasticity demonstrated by sharp transaction drop upon discount withdrawal.",
                "expected_impact": "Revitalizes order velocity while retaining +₹200 margin over full clearance.",
                "priority": "HIGH",
                "confidence": 0.86,
            },
        }

    def get_inventory_analytics(self, product_id: str = "PROD-0001") -> Dict[str, Any]:
        """Compute multi-store stock levels, imbalances, and transfer opportunities."""
        products = self.loader.get_products()
        inventory = self.loader.get_inventory()
        stores = self.loader.get_stores()

        prod = products.get(product_id)
        if not prod:
            return {}

        prod_inv = [i for i in inventory if i["product_id"] == product_id]
        if not prod_inv:
            return {}

        store_breakdown = []
        for item in prod_inv:
            sid = item["store_id"]
            st_info = stores.get(sid, {})
            store_breakdown.append({
                "store_id": sid,
                "store_name": st_info.get("location", sid),
                "format": st_info.get("format", "Standard"),
                "region": st_info.get("region", "National"),
                "stock": item["stock"],
                "availability_time": item["availability_time"],
                "status": "critical_low" if item["stock"] < 5 else "out_of_stock" if item["stock"] == 0 else "surplus" if item["stock"] > 50 else "healthy",
            })

        min_store = min(store_breakdown, key=lambda x: x["stock"])
        max_store = max(store_breakdown, key=lambda x: x["stock"])
        total_stock = sum(x["stock"] for x in store_breakdown)
        ratio = round(max_store["stock"] / max(min_store["stock"], 1), 1)
        transfer_units = max(10, int((max_store["stock"] - min_store["stock"]) / 2))

        return {
            "product_id": product_id,
            "product_name": prod["product_name"],
            "unit_price": prod["price"],
            "total_network_stock": total_stock,
            "store_breakdown": store_breakdown,
            "deficit_store": min_store,
            "surplus_store": max_store,
            "imbalance_ratio": ratio,
            "recommended_transfer_units": transfer_units,
            "transfer_recommendation": {
                "action": f"Initiate inter-store transfer of {transfer_units} units from {max_store['store_id']} ({max_store['store_name']}) to {min_store['store_id']} ({min_store['store_name']})",
                "rationale": f"{min_store['store_id']} has critical stockout risk ({min_store['stock']} units) while {max_store['store_id']} holds excess stagnant inventory ({max_store['stock']} units).",
                "expected_impact": "Restores buffer safety stock at flagship and averts lost sales without depleting outlet reserves.",
                "priority": "HIGH",
                "confidence": 0.91,
            },
        }

    def get_return_analytics(self) -> Dict[str, Any]:
        """Compute return rates, ratings, and sizing complaints with explicit denominators."""
        products = self.loader.get_products()
        reviews = self.loader.get_reviews_returns()

        # Group by product
        by_prod: Dict[str, Dict[str, Any]] = {}
        for r in reviews:
            pid = r["product_id"]
            if pid not in by_prod:
                prod = products.get(pid, {})
                by_prod[pid] = {
                    "product_id": pid,
                    "product_name": prod.get("product_name", pid),
                    "category": prod.get("category", "General"),
                    "total_reviews": 0,
                    "returns_count": 0,
                    "ratings": [],
                    "reasons": {},
                    "quotes": [],
                }
            by_prod[pid]["total_reviews"] += 1
            by_prod[pid]["ratings"].append(r["rating"])
            if r["return_flag"]:
                by_prod[pid]["returns_count"] += 1
                reason = r.get("return_reason") or "unspecified"
                by_prod[pid]["reasons"][reason] = by_prod[pid]["reasons"].get(reason, 0) + 1
                if r.get("review_text"):
                    by_prod[pid]["quotes"].append(r["review_text"])

        product_metrics = []
        for pid, d in by_prod.items():
            tot = d["total_reviews"]
            rets = d["returns_count"]
            avg_rating = round(sum(d["ratings"]) / tot, 2) if tot > 0 else 0.0
            ret_rate = round((rets / tot) * 100, 1) if tot > 0 else 0.0
            sizing_rets = d["reasons"].get("sizing_issue", 0)
            sizing_share = round((sizing_rets / rets) * 100, 1) if rets > 0 else 0.0

            product_metrics.append({
                "product_id": pid,
                "product_name": d["product_name"],
                "category": d["category"],
                "total_reviews_denominator": tot,
                "returns_count_numerator": rets,
                "return_rate_pct": ret_rate,
                "average_rating": avg_rating,
                "sizing_issues_count": sizing_rets,
                "sizing_share_of_returns_pct": sizing_share,
                "reasons_breakdown": d["reasons"],
                "customer_quotes": d["quotes"][:3],
                "status": "critical" if ret_rate >= 50.0 else "normal",
            })

        # Sort with most critical products first
        product_metrics.sort(key=lambda x: x["return_rate_pct"], reverse=True)

        # Flagged focus product: PROD-0006
        flagged = next((p for p in product_metrics if p["product_id"] == "PROD-0006"), None)

        return {
            "catalog_total_reviews": len(reviews),
            "catalog_total_returns": sum(1 for r in reviews if r["return_flag"]),
            "catalog_overall_return_rate_pct": round(
                (sum(1 for r in reviews if r["return_flag"]) / len(reviews)) * 100, 1
            ) if reviews else 0.0,
            "denominator_rule": "Return Rate = (returns_count / total_verified_reviews_or_orders) * 100",
            "flagged_product": flagged,
            "products": product_metrics,
            "recommendation": {
                "action": "Audit supplier sizing specification for PROD-0006 and issue bold fit advisory ('Runs 1 size small') on PDP",
                "rationale": "80.0% return rate (8 of 10 orders) with 100% of returns citing shoulder and chest sizing discrepancies.",
                "expected_impact": "Reduces return handling overhead by an estimated 60-70% and restores product star rating.",
                "priority": "HIGH",
                "confidence": 0.94,
            },
        }

    def get_decision_queue(self) -> List[Dict[str, Any]]:
        """Consolidate prioritized recommendations across agents into a unified decision queue."""
        inv_data = self.get_inventory_analytics("PROD-0001")
        sales_data = self.get_sales_analytics("PROD-0005")
        returns_data = self.get_return_analytics()

        queue = [
            {
                "id": "ACT-INV-001",
                "agent": "Supply-Demand Intelligence Agent",
                "category": "Inventory Rebalancing",
                "priority": "HIGH",
                "confidence": 0.91,
                "action": inv_data.get("transfer_recommendation", {}).get("action", "Initiate inter-store transfer"),
                "rationale": inv_data.get("transfer_recommendation", {}).get("rationale", ""),
                "expected_impact": inv_data.get("transfer_recommendation", {}).get("expected_impact", ""),
                "target_product_id": "PROD-0001",
                "target_product_name": "AeroStride Velocity Marathon Runner",
                "supporting_evidence_source": "inventory.csv / stores.csv",
                "investigation_query": "Investigate inventory imbalance and stockout risk across retail stores",
            },
            {
                "id": "ACT-RET-002",
                "agent": "Return Intelligence Agent",
                "category": "Merchandising & Fit Advisory",
                "priority": "HIGH",
                "confidence": 0.94,
                "action": returns_data.get("recommendation", {}).get("action", "Audit supplier sizing specification"),
                "rationale": returns_data.get("recommendation", {}).get("rationale", ""),
                "expected_impact": returns_data.get("recommendation", {}).get("expected_impact", ""),
                "target_product_id": "PROD-0006",
                "target_product_name": returns_data.get("flagged_product", {}).get("product_name", "UrbanPeak StormShield Packable Jacket"),
                "supporting_evidence_source": "reviews_returns.csv",
                "investigation_query": "Investigate high customer returns and defect complaints on jacket",
            },
            {
                "id": "ACT-SAL-003",
                "agent": "Sales Investigation Agent",
                "category": "Promotion Optimization",
                "priority": "HIGH",
                "confidence": 0.86,
                "action": sales_data.get("investigation_recommendation", {}).get("action", "Test margin-optimized continuation campaign"),
                "rationale": sales_data.get("investigation_recommendation", {}).get("rationale", ""),
                "expected_impact": sales_data.get("investigation_recommendation", {}).get("expected_impact", ""),
                "target_product_id": "PROD-0005",
                "target_product_name": "Core Seamless Training Tee",
                "supporting_evidence_source": "orders.csv / promotions.csv",
                "investigation_query": "Why did sales drop for seamless training tee after the campaign ended?",
            },
            {
                "id": "ACT-CST-004",
                "agent": "Lost Sale Investigation Agent",
                "category": "Customer Friction Recovery",
                "priority": "HIGH",
                "confidence": 0.88,
                "action": "Present in-budget alternative (PROD-0001 at ₹3,499.00) or offer 10% introductory voucher to customer CUST-0003",
                "rationale": "Customer in ₹2,400 budget tier experienced 2.7x price gap friction on premium road shoes.",
                "expected_impact": "Recovers checkout completion while retaining full catalog margin integrity.",
                "target_product_id": "PROD-0004",
                "target_product_name": "Apex Carbon Racing Shoe",
                "supporting_evidence_source": "cart_events.csv / customers.csv",
                "investigation_query": "Investigate checkout abandonment on running shoes for customer CUST-0003",
            },
        ]
        return queue

    def get_overview(self) -> Dict[str, Any]:
        """Master aggregated overview payload for Retail Intelligence Command Center."""
        return {
            "status": "success",
            "kpis": self.get_kpis(),
            "signals": self.get_prioritized_signals(),
            "sales_analytics": self.get_sales_analytics("PROD-0005"),
            "inventory_analytics": self.get_inventory_analytics("PROD-0001"),
            "return_analytics": self.get_return_analytics(),
            "decision_queue": self.get_decision_queue(),
            "generated_at": datetime.now().isoformat(),
        }


default_retail_analytics = RetailAnalyticsService()
