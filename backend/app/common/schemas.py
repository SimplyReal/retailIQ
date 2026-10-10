"""Shared Intelligence Contracts for RetailIQ.

Provides domain-neutral Pydantic models for:
- Evidence
- Recommendation
- AgentResult
- InvestigationRequest
- InvestigationResponse
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional, Union
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field, field_validator


EvidenceType = Literal["metric", "data_point", "retrieval", "event"]
PriorityLevel = Literal["HIGH", "MEDIUM", "LOW"]
InvestigationStatus = Literal["completed", "pending", "in_progress", "failed"]
DomainType = Literal["customer", "retail", "cross_domain"]


def _validate_non_empty_str(field_name: str, value: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"'{field_name}' must be a non-empty string.")
    return value.strip()


class Evidence(BaseModel):
    """Factual, query, or retrieval evidence supporting an agent finding."""

    model_config = ConfigDict(extra="forbid")

    type: EvidenceType = Field(
        ...,
        description="Classification of evidence (metric, data_point, retrieval, event)",
    )
    label: str = Field(
        ...,
        min_length=1,
        description="Human-readable summary label of the evidence item",
    )
    value: Any = Field(
        ...,
        description="Observed value, data structure, or metric figure",
    )
    source: str = Field(
        ...,
        min_length=1,
        description="Source dataset, table, query, or document reference",
    )

    @field_validator("label", "source")
    @classmethod
    def check_non_empty_text(cls, v: str, info) -> str:
        return _validate_non_empty_str(info.field_name, v)


class Recommendation(BaseModel):
    """Evidence-backed business or customer action proposed for human decision."""

    model_config = ConfigDict(extra="forbid")

    action: str = Field(
        ...,
        min_length=1,
        description="Concise description of the recommended intervention",
    )
    rationale: str = Field(
        ...,
        min_length=1,
        description="Justification explaining why this action is recommended",
    )
    expected_impact: str = Field(
        ...,
        min_length=1,
        description="Projected operational or commercial outcome",
    )
    priority: PriorityLevel = Field(
        ...,
        description="Urgency/importance rating (HIGH, MEDIUM, LOW)",
    )
    confidence: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Recommendation-specific confidence score (0.0 to 1.0)",
    )

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority(cls, v: Any) -> str:
        if isinstance(v, str):
            upper_v = v.strip().upper()
            if upper_v in ("HIGH", "MEDIUM", "LOW"):
                return upper_v
        return v

    @field_validator("action", "rationale", "expected_impact")
    @classmethod
    def check_non_empty_text(cls, v: str, info) -> str:
        return _validate_non_empty_str(info.field_name, v)


class AgentResult(BaseModel):
    """Standardized output contract returned by all RetailIQ specialist agents."""

    model_config = ConfigDict(extra="forbid")

    agent: str = Field(
        ...,
        min_length=1,
        description="Identifier or name of the specialist agent generating the result",
    )
    finding: str = Field(
        ...,
        min_length=1,
        description="Synthesized summary of the analytical or customer diagnosis",
    )
    evidence: List[Evidence] = Field(
        default_factory=list,
        description="Collection of verifiable evidence items backing the finding",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score for finding and rationale (0.0 to 1.0)",
    )
    recommendations: List[Recommendation] = Field(
        default_factory=list,
        description="Prioritized recommendations derived from the finding",
    )
    sources: List[str] = Field(
        default_factory=list,
        description="Originating tables, telemetry streams, or indices referenced",
    )

    @field_validator("agent", "finding")
    @classmethod
    def check_non_empty_text(cls, v: str, info) -> str:
        return _validate_non_empty_str(info.field_name, v)

    @field_validator("sources")
    @classmethod
    def check_non_empty_sources(cls, v: List[str]) -> List[str]:
        cleaned = []
        for idx, src in enumerate(v):
            if not isinstance(src, str) or not src.strip():
                raise ValueError(f"Source at index {idx} must be a non-empty string.")
            cleaned.append(src.strip())
        return cleaned


class InvestigationRequest(BaseModel):
    """Domain-neutral input triggering a RetailIQ investigation flow."""

    model_config = ConfigDict(extra="forbid")

    query: str = Field(
        ...,
        min_length=1,
        description="Natural-language shopping inquiry, KPI question, or anomaly signal",
    )
    customer_id: Optional[str] = Field(
        None,
        description="Optional customer identifier context (e.g., CUST-0001)",
    )
    product_id: Optional[str] = Field(
        None,
        description="Optional product identifier context (e.g., PROD-0001)",
    )
    store_id: Optional[str] = Field(
        None,
        description="Optional store identifier context (e.g., STORE-001)",
    )
    order_id: Optional[str] = Field(
        None,
        description="Optional order identifier context (e.g., ORD-00001)",
    )
    domain: Optional[DomainType] = Field(
        None,
        description="Target intelligence domain (customer, retail, cross_domain)",
    )
    parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional configuration or filter parameters",
    )

    @field_validator("query")
    @classmethod
    def check_query_non_empty(cls, v: str) -> str:
        return _validate_non_empty_str("query", v)

    @field_validator("customer_id", "product_id", "store_id", "order_id")
    @classmethod
    def check_optional_id(cls, v: Optional[str], info) -> Optional[str]:
        if v is not None:
            return _validate_non_empty_str(info.field_name, v)
        return None


class InvestigationResponse(BaseModel):
    """Domain-neutral response representing an assembled investigation."""

    model_config = ConfigDict(extra="forbid")

    investigation_id: str = Field(
        default_factory=lambda: f"INV-{uuid4().hex[:8].upper()}",
        description="Unique identifier for the investigation trace",
    )
    status: InvestigationStatus = Field(
        default="completed",
        description="Investigation processing lifecycle state",
    )
    request: Optional[InvestigationRequest] = Field(
        None,
        description="Original investigation request parameters",
    )
    findings: List[AgentResult] = Field(
        default_factory=list,
        description="Specialist agent findings and evidence collections",
    )
    summary: Optional[str] = Field(
        None,
        description="High-level synthesized summary across findings",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Diagnostic or execution metadata (e.g. latency, route, trace)",
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="UTC ISO 8601 timestamp of response creation",
    )

    @field_validator("summary")
    @classmethod
    def check_summary(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return _validate_non_empty_str("summary", v)
        return None
