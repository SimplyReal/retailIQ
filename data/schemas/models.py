"""Pydantic V2 Data Models for RetailIQ Schemas."""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class CustomerModel(BaseModel):
    customer_id: str = Field(..., pattern=r"^CUST-\d{4,}$")
    age_group: Literal["18-25", "26-35", "36-50", "51+"]
    location: str
    preferred_category: str
    preferred_brands: str = ""
    avg_order_value: float = Field(..., ge=0)
    price_range: Literal["Budget", "Mid-Range", "Premium"]
    loyalty_tier: Literal["Bronze", "Silver", "Gold", "Platinum"]


class ProductModel(BaseModel):
    product_id: str = Field(..., pattern=r"^PROD-\d{4,}$")
    product_name: str
    category: str
    subcategory: str
    brand: str
    price: float = Field(..., ge=0)
    rating: float = Field(..., ge=1.0, le=5.0)
    attributes: str
    description: str


class SearchEventModel(BaseModel):
    event_id: str = Field(..., pattern=r"^SRCH-\d{5,}$")
    customer_id: str = Field(..., pattern=r"^CUST-\d{4,}$")
    query: str
    timestamp: str


class BrowsingEventModel(BaseModel):
    event_id: str = Field(..., pattern=r"^BRW-\d{5,}$")
    customer_id: str = Field(..., pattern=r"^CUST-\d{4,}$")
    product_id: str = Field(..., pattern=r"^PROD-\d{4,}$")
    event_type: Literal["view", "click", "scroll", "hover"]
    duration: int = Field(..., ge=0)
    timestamp: str


class CartEventModel(BaseModel):
    event_id: str = Field(..., pattern=r"^CRT-\d{5,}$")
    customer_id: str = Field(..., pattern=r"^CUST-\d{4,}$")
    product_id: str = Field(..., pattern=r"^PROD-\d{4,}$")
    action: Literal["add", "remove", "abandon", "checkout_start"]
    quantity: int = Field(..., ge=1)
    timestamp: str


class OrderModel(BaseModel):
    order_id: str = Field(..., pattern=r"^ORD-\d{5,}$")
    customer_id: str = Field(..., pattern=r"^CUST-\d{4,}$")
    product_id: str = Field(..., pattern=r"^PROD-\d{4,}$")
    quantity: int = Field(..., ge=1)
    price: float = Field(..., ge=0)
    discount: float = Field(..., ge=0)
    order_date: str
    channel: Literal["online", "in-store", "app"]


class ReviewReturnModel(BaseModel):
    customer_id: str = Field(..., pattern=r"^CUST-\d{4,}$")
    product_id: str = Field(..., pattern=r"^PROD-\d{4,}$")
    rating: int = Field(..., ge=1, le=5)
    review_text: str
    return_flag: bool
    return_reason: Optional[str] = None
    date: str


class InventoryModel(BaseModel):
    product_id: str = Field(..., pattern=r"^PROD-\d{4,}$")
    store_id: str = Field(..., pattern=r"^STORE-\d{3,}$")
    stock: int = Field(..., ge=0)
    availability_time: Literal["in_stock", "same_day", "next_day", "2_3_days", "out_of_stock"]


class StoreModel(BaseModel):
    store_id: str = Field(..., pattern=r"^STORE-\d{3,}$")
    location: str
    format: Literal["Flagship", "Express", "Outlet", "Warehouse"]
    region: Literal["North", "South", "East", "West", "Central"]


class PromotionModel(BaseModel):
    product_id: str = Field(..., pattern=r"^PROD-\d{4,}$")
    campaign: str
    discount: float = Field(..., ge=0)
    start_date: str
    end_date: str
    channel: Literal["all", "online", "in-store", "app"]


class DeliveryEventModel(BaseModel):
    order_id: str = Field(..., pattern=r"^ORD-\d{5,}$")
    promised_date: str
    actual_date: str
    delay_days: int = Field(..., ge=0)
    status: Literal["delivered", "delayed", "in_transit", "failed"]


class SupportConversationModel(BaseModel):
    customer_id: str = Field(..., pattern=r"^CUST-\d{4,}$")
    order_id: Optional[str] = None
    issue_type: Literal["delivery_delay", "sizing_inquiry", "refund_status", "product_defect", "general_inquiry"]
    conversation_text: str
    resolution: Literal["resolved", "escalated", "pending", "refund_issued"]
    timestamp: str
