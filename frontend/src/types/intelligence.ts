/**
 * RetailIQ Shared Intelligence TypeScript Interfaces.
 * Mirrors backend/app/common/schemas.py.
 */

export type EvidenceType = "metric" | "data_point" | "retrieval" | "event";
export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW";
export type InvestigationStatus = "completed" | "pending" | "in_progress" | "failed";
export type DomainType = "customer" | "retail" | "cross_domain";

export interface Evidence {
  type: EvidenceType;
  label: string;
  value: any;
  source: string;
}

export interface Recommendation {
  action: string;
  rationale: string;
  expected_impact: string;
  priority: PriorityLevel;
  confidence?: number | null;
}

export interface AgentResult {
  agent: string;
  finding: string;
  evidence: Evidence[];
  confidence: number;
  recommendations: Recommendation[];
  sources: string[];
}

export interface InvestigationRequest {
  query: string;
  customer_id?: string | null;
  product_id?: string | null;
  store_id?: string | null;
  order_id?: string | null;
  domain?: DomainType | null;
  parameters?: Record<string, any>;
}

export interface InvestigationResponse {
  investigation_id: string;
  status: InvestigationStatus;
  request?: InvestigationRequest | null;
  findings: AgentResult[];
  summary?: string | null;
  metadata: {
    query_matched?: boolean;
    findings_count?: number;
    execution_time_ms?: number;
    supported_scenarios?: string[];
    [key: string]: any;
  };
  timestamp: string;
}

export interface Product {
  product_id: string;
  product_name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  rating: number;
  attributes: {
    color?: string;
    sizes?: string[];
    weight?: string;
    grip?: string;
    cushion?: string;
    plate?: string;
    tech?: string;
    waterproof?: string;
    liner?: string;
    capacity?: string;
    [key: string]: any;
  };
  description: string;
  statusBadge?: "in_stock" | "out_of_stock" | "low_stock" | "high_return_rate";
  badgeText?: string;
}

export interface RetailKPIs {
  sales: {
    total_revenue: number;
    order_count: number;
    average_order_value: number;
    currency: string;
  };
  inventory: {
    total_network_units: number;
    total_sku_store_combinations: number;
    low_stock_count: number;
    out_of_stock_count: number;
  };
  returns: {
    total_reviews: number;
    total_returns: number;
    overall_return_rate_pct: number;
    denominator_explanation: string;
  };
  promotions: {
    active_campaign_count: number;
    tracked_campaigns: string[];
  };
}

export interface RetailSignal {
  id: string;
  domain: "returns" | "sales" | "inventory" | "customer";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  product_id: string;
  product_name: string;
  summary: string;
  metric_label: string;
  metric_value: string;
  denominator: string;
  investigation_query: string;
  action_tab: "command" | "sales" | "inventory" | "returns" | "actions";
}

export interface SalesAnalytics {
  product_id: string;
  product_name: string;
  unit_price: number;
  promotion_lifecycle: {
    campaign_name: string;
    discount_amount: number;
    start_date: string;
    campaign_end_date: string;
    status: string;
  };
  period_1_promo: {
    label: string;
    orders_count: number;
    gross_revenue: number;
    discount_total: number;
    net_revenue: number;
    orders_sample: any[];
  };
  period_2_post_promo: {
    label: string;
    orders_count: number;
    gross_revenue: number;
    discount_total: number;
    net_revenue: number;
    orders_sample: any[];
  };
  calculated_changes: {
    order_volume_drop_pct: number;
    net_revenue_drop_pct: number;
    volume_delta_orders: number;
    net_revenue_delta_inr: number;
  };
  investigation_recommendation: {
    action: string;
    rationale: string;
    expected_impact: string;
    priority: PriorityLevel;
    confidence: number;
  };
}

export interface InventoryStoreItem {
  store_id: string;
  store_name: string;
  format: string;
  region: string;
  stock: number;
  availability_time: string;
  status: "critical_low" | "out_of_stock" | "surplus" | "healthy";
}

export interface InventoryAnalytics {
  product_id: string;
  product_name: string;
  unit_price: number;
  total_network_stock: number;
  store_breakdown: InventoryStoreItem[];
  deficit_store: InventoryStoreItem;
  surplus_store: InventoryStoreItem;
  imbalance_ratio: number;
  recommended_transfer_units: number;
  transfer_recommendation: {
    action: string;
    rationale: string;
    expected_impact: string;
    priority: PriorityLevel;
    confidence: number;
  };
}

export interface ReturnProductMetric {
  product_id: string;
  product_name: string;
  category: string;
  total_reviews_denominator: number;
  returns_count_numerator: number;
  return_rate_pct: number;
  average_rating: number;
  sizing_issues_count: number;
  sizing_share_of_returns_pct: number;
  reasons_breakdown: Record<string, number>;
  customer_quotes: string[];
  status: "critical" | "normal";
}

export interface ReturnAnalytics {
  catalog_total_reviews: number;
  catalog_total_returns: number;
  catalog_overall_return_rate_pct: number;
  denominator_rule: string;
  flagged_product?: ReturnProductMetric;
  products: ReturnProductMetric[];
  recommendation: {
    action: string;
    rationale: string;
    expected_impact: string;
    priority: PriorityLevel;
    confidence: number;
  };
}

export interface DecisionQueueItem {
  id: string;
  agent: string;
  category: string;
  priority: PriorityLevel;
  confidence: number;
  action: string;
  rationale: string;
  expected_impact: string;
  target_product_id: string;
  target_product_name: string;
  supporting_evidence_source: string;
  investigation_query: string;
}

export interface RetailOverview {
  status: string;
  kpis: RetailKPIs;
  signals: RetailSignal[];
  sales_analytics: SalesAnalytics;
  inventory_analytics: InventoryAnalytics;
  return_analytics: ReturnAnalytics;
  decision_queue: DecisionQueueItem[];
  generated_at: string;
}
