"""Deterministic Synthetic Data Generator for RetailIQ.

Generates the 10 MVP datasets (plus optional delivery and support datasets)
with realistic relational links and intentionally seeded retail scenarios:
1. Price-related cart abandonment
2. Unavailable sizes / Out of stock
3. Sales decline across periods
4. Cross-store stock imbalance
5. Sizing-defect product returns
"""

import argparse
import csv
import json
import os
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Any


DEFAULT_SEED = 42

CATEGORIES = {
    "Footwear": ["Running Shoes", "Trail Shoes", "Sneakers", "Training Shoes"],
    "Apparel": ["Performance T-Shirt", "Packable Jacket", "Training Shorts", "Compression Tights"],
    "Fitness & Gear": ["Hydration Pack", "Fitness Band", "Gym Duffel", "Yoga Mat"],
}

CITIES = [
    ("Mumbai", "West"),
    ("Delhi", "North"),
    ("Bengaluru", "South"),
    ("Hyderabad", "South"),
    ("Ahmedabad", "West"),
    ("Kolkata", "East"),
]

BRANDS = ["AeroStride", "PulseWear", "UrbanPeak", "HyperFit", "TerraFlex"]


def get_base_date() -> datetime:
    return datetime(2026, 9, 1, 9, 0, 0, tzinfo=timezone.utc)


def generate_stores(rng: random.Random, count: int) -> List[Dict[str, Any]]:
    stores = []
    formats = ["Flagship", "Express", "Outlet", "Warehouse"]
    
    # Intentionally seeded stores
    seeded = [
        {"store_id": "STORE-001", "location": "Mumbai - Bandra", "format": "Flagship", "region": "West"},
        {"store_id": "STORE-002", "location": "Delhi - Connaught Place", "format": "Flagship", "region": "North"},
        {"store_id": "STORE-003", "location": "Bengaluru - Indiranagar", "format": "Express", "region": "South"},
        {"store_id": "STORE-004", "location": "Ahmedabad - SG Highway", "format": "Outlet", "region": "West"},
        {"store_id": "STORE-005", "location": "Kolkata - Park Street", "format": "Express", "region": "East"},
    ]
    
    for s in seeded[:count]:
        stores.append(s)
        
    for i in range(len(stores) + 1, count + 1):
        city, region = rng.choice(CITIES)
        fmt = rng.choice(formats)
        stores.append({
            "store_id": f"STORE-{i:03d}",
            "location": f"{city} - Suburb {i}",
            "format": fmt,
            "region": region,
        })
    return stores


def generate_products(rng: random.Random, count: int) -> List[Dict[str, Any]]:
    # Specific seeded products critical for scenarios
    seeded_products = [
        {
            "product_id": "PROD-0001",
            "product_name": "AeroStride Velocity Marathon Runner",
            "category": "Footwear",
            "subcategory": "Running Shoes",
            "brand": "AeroStride",
            "price": 3499.00,
            "rating": 4.6,
            "attributes": json.dumps({"color": "Black", "sizes": ["UK 8", "UK 9", "UK 10"], "weight": "210g"}),
            "description": "Engineered lightweight marathon shoes with responsive foam.",
        },
        {
            "product_id": "PROD-0002",
            "product_name": "TerraFlex TrailClimb Pro Hiker",
            "category": "Footwear",
            "subcategory": "Trail Shoes",
            "brand": "TerraFlex",
            "price": 4199.00,
            "rating": 4.4,
            "attributes": json.dumps({"color": "Olive Green", "sizes": ["UK 9", "UK 10", "UK 11"], "grip": "Vibram"}),
            "description": "Rugged all-weather trail shoe with reinforced toe protection.",
        },
        {
            "product_id": "PROD-0003",
            "product_name": "PulseWear LiteFlex Trainer",
            "category": "Footwear",
            "subcategory": "Training Shoes",
            "brand": "PulseWear",
            "price": 2799.00,
            "rating": 4.2,
            "attributes": json.dumps({"color": "Grey/Neon", "sizes": ["UK 7", "UK 8", "UK 9", "UK 10"], "cushion": "Gel"}),
            "description": "Versatile gym and cross-training athletic shoe.",
        },
        {
            "product_id": "PROD-0004",
            "product_name": "AeroStride Apex Carbon Road Racer",
            "category": "Footwear",
            "subcategory": "Running Shoes",
            "brand": "AeroStride",
            "price": 6499.00,
            "rating": 4.8,
            "attributes": json.dumps({"color": "Stealth Black", "sizes": ["UK 8", "UK 9", "UK 10"], "plate": "Full Carbon"}),
            "description": "Premium elite marathon racing shoe with carbon-fiber propulsion plate.",
        },
        {
            "product_id": "PROD-0005",
            "product_name": "PulseWear AeroTech Seamless Tee",
            "category": "Apparel",
            "subcategory": "Performance T-Shirt",
            "brand": "PulseWear",
            "price": 1499.00,
            "rating": 4.1,
            "attributes": json.dumps({"color": "Navy Blue", "sizes": ["S", "M", "L", "XL"], "tech": "Anti-Odor"}),
            "description": "Sweat-wicking seamless active tee with athletic taper.",
        },
        {
            "product_id": "PROD-0006",
            "product_name": "UrbanPeak StormShield Packable Jacket",
            "category": "Apparel",
            "subcategory": "Packable Jacket",
            "brand": "UrbanPeak",
            "price": 3899.00,
            "rating": 2.6,
            "attributes": json.dumps({"color": "Charcoal", "sizes": ["S", "M", "L"], "waterproof": "5000mm"}),
            "description": "Ultralight water-resistant windbreaker jacket with packable pouch.",
        },
        {
            "product_id": "PROD-0007",
            "product_name": "HyperFit Core Training Shorts",
            "category": "Apparel",
            "subcategory": "Training Shorts",
            "brand": "HyperFit",
            "price": 1199.00,
            "rating": 4.3,
            "attributes": json.dumps({"color": "Black", "sizes": ["M", "L", "XL"], "liner": "Compression"}),
            "description": "2-in-1 shorts with phone pocket and flexible 4-way stretch.",
        },
        {
            "product_id": "PROD-0008",
            "product_name": "TerraFlex HydroGrip Trail Vest",
            "category": "Fitness & Gear",
            "subcategory": "Hydration Pack",
            "brand": "TerraFlex",
            "price": 2299.00,
            "rating": 4.5,
            "attributes": json.dumps({"color": "Black/Orange", "capacity": "5L", "flasks": "2x500ml"}),
            "description": "Ergonomic running hydration vest with dual flask pockets.",
        },
    ]
    
    products = []
    for p in seeded_products[:count]:
        products.append(p)
        
    for i in range(len(products) + 1, count + 1):
        cat = rng.choice(list(CATEGORIES.keys()))
        subcat = rng.choice(CATEGORIES[cat])
        brand = rng.choice(BRANDS)
        price = round(rng.uniform(799, 4999), 2)
        rating = round(rng.uniform(3.5, 4.9), 1)
        colors = ["Black", "White", "Navy", "Grey", "Teal"]
        attributes = {
            "color": rng.choice(colors),
            "sizes": ["S", "M", "L"] if cat == "Apparel" else ["UK 8", "UK 9", "UK 10"],
        }
        products.append({
            "product_id": f"PROD-{i:04d}",
            "product_name": f"{brand} {subcat} {i}",
            "category": cat,
            "subcategory": subcat,
            "brand": brand,
            "price": price,
            "rating": rating,
            "attributes": json.dumps(attributes),
            "description": f"High performance {subcat.lower()} engineered for durability and style.",
        })
    return products


def generate_customers(rng: random.Random, count: int) -> List[Dict[str, Any]]:
    # Specific seeded customers
    seeded_customers = [
        {
            "customer_id": "CUST-0001",
            "age_group": "26-35",
            "location": "Mumbai",
            "preferred_category": "Footwear",
            "preferred_brands": "AeroStride,PulseWear",
            "avg_order_value": 3500.00,
            "price_range": "Mid-Range",
            "loyalty_tier": "Gold",
        },
        {
            "customer_id": "CUST-0002",
            "age_group": "26-35",
            "location": "Mumbai",
            "preferred_category": "Footwear",
            "preferred_brands": "TerraFlex",
            "avg_order_value": 4200.00,
            "price_range": "Mid-Range",
            "loyalty_tier": "Silver",
        },
        {
            "customer_id": "CUST-0003",
            "age_group": "18-25",
            "location": "Delhi",
            "preferred_category": "Footwear",
            "preferred_brands": "AeroStride",
            "avg_order_value": 2400.00,
            "price_range": "Budget",
            "loyalty_tier": "Bronze",
        },
        {
            "customer_id": "CUST-0004",
            "age_group": "36-50",
            "location": "Bengaluru",
            "preferred_category": "Apparel",
            "preferred_brands": "PulseWear,UrbanPeak",
            "avg_order_value": 5200.00,
            "price_range": "Premium",
            "loyalty_tier": "Platinum",
        },
        {
            "customer_id": "CUST-0005",
            "age_group": "26-35",
            "location": "Ahmedabad",
            "preferred_category": "Apparel",
            "preferred_brands": "UrbanPeak",
            "avg_order_value": 3100.00,
            "price_range": "Mid-Range",
            "loyalty_tier": "Silver",
        },
    ]
    
    customers = []
    for c in seeded_customers[:count]:
        customers.append(c)
        
    age_groups = ["18-25", "26-35", "36-50", "51+"]
    price_ranges = ["Budget", "Mid-Range", "Premium"]
    tiers = ["Bronze", "Silver", "Gold", "Platinum"]
    
    for i in range(len(customers) + 1, count + 1):
        city, _ = rng.choice(CITIES)
        cat = rng.choice(list(CATEGORIES.keys()))
        fav_brand = rng.choice(BRANDS)
        tier = rng.choice(tiers)
        pr = rng.choice(price_ranges)
        aov = 2000.00 if pr == "Budget" else (4000.00 if pr == "Mid-Range" else 7500.00)
        aov = round(aov + rng.uniform(-400, 600), 2)
        customers.append({
            "customer_id": f"CUST-{i:04d}",
            "age_group": rng.choice(age_groups),
            "location": city,
            "preferred_category": cat,
            "preferred_brands": fav_brand,
            "avg_order_value": aov,
            "price_range": pr,
            "loyalty_tier": tier,
        })
    return customers


def generate_promotions(rng: random.Random, products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    promos = [
        {
            "product_id": "PROD-0001",
            "campaign": "MarathonSeasonKickoff",
            "discount": 350.00,
            "start_date": "2026-09-01",
            "end_date": "2026-09-30",
            "channel": "all",
        },
        {
            "product_id": "PROD-0003",
            "campaign": "GymStarterBonus",
            "discount": 300.00,
            "start_date": "2026-09-05",
            "end_date": "2026-10-15",
            "channel": "online",
        },
        {
            "product_id": "PROD-0005",
            "campaign": "MonsoonClearanceEarly",
            "discount": 400.00,
            "start_date": "2026-09-01",
            "end_date": "2026-09-15",  # Expired mid-month: explains sales decline in period 2
            "channel": "all",
        },
        {
            "product_id": "PROD-0007",
            "campaign": "FitnessFestival",
            "discount": 200.00,
            "start_date": "2026-09-10",
            "end_date": "2026-10-05",
            "channel": "app",
        },
    ]
    # No promo for PROD-0004 or PROD-0006
    # Add random promos for other products
    for p in products[7:]:
        if rng.random() < 0.4:
            disc = round(p["price"] * rng.choice([0.10, 0.15, 0.20]), 2)
            promos.append({
                "product_id": p["product_id"],
                "campaign": f"SpecialDeal_{p['category'][:4]}",
                "discount": disc,
                "start_date": "2026-09-01",
                "end_date": "2026-10-31",
                "channel": rng.choice(["all", "online", "in-store"]),
            })
    return promos


def generate_inventory(
    rng: random.Random, products: List[Dict[str, Any]], stores: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    inventory = []
    
    for p in products:
        pid = p["product_id"]
        for s in stores:
            sid = s["store_id"]
            
            # Scenario 4: Stock Imbalance for PROD-0001
            if pid == "PROD-0001":
                if sid == "STORE-001":
                    # Metro store critically stocked out
                    stock = 2
                    avail = "same_day"
                elif sid == "STORE-004":
                    # Suburban outlet heavily overstocked
                    stock = 85
                    avail = "in_stock"
                else:
                    stock = rng.randint(15, 30)
                    avail = "in_stock"
            
            # Scenario 2: Unavailable size/stockout for PROD-0002
            elif pid == "PROD-0002":
                if sid in ["STORE-001", "STORE-002"]:
                    # Stockout in target stores
                    stock = 0
                    avail = "out_of_stock"
                else:
                    stock = rng.randint(4, 12)
                    avail = "in_stock"
                    
            # Normal distribution for other items
            else:
                stock = rng.randint(10, 50)
                avail = "in_stock" if stock > 5 else ("2_3_days" if stock > 0 else "out_of_stock")
                
            inventory.append({
                "product_id": pid,
                "store_id": sid,
                "stock": stock,
                "availability_time": avail,
            })
    return inventory


def generate_events_and_orders(
    rng: random.Random,
    customers: List[Dict[str, Any]],
    products: List[Dict[str, Any]],
    stores: List[Dict[str, Any]],
    promotions: List[Dict[str, Any]],
    scale_factor: int,
) -> Dict[str, List[Dict[str, Any]]]:
    base_time = get_base_date()
    
    searches = []
    browsing = []
    cart_events = []
    orders = []
    reviews_returns = []
    delivery_events = []
    support_conversations = []
    
    search_idx = 1
    browse_idx = 1
    cart_idx = 1
    order_idx = 1
    
    promo_map = {p["product_id"]: p for p in promotions}
    prod_map = {p["product_id"]: p for p in products}
    
    # ----------------------------------------------------
    # Seeded Scenario 1: Price-Related Cart Abandonment
    # Customer: CUST-0003 (Budget) adds PROD-0004 (Rs 6499)
    # ----------------------------------------------------
    t1 = base_time + timedelta(days=2, hours=10, minutes=15)
    searches.append({
        "event_id": f"SRCH-{search_idx:05d}",
        "customer_id": "CUST-0003",
        "query": "lightweight carbon road running shoes under 4000",
        "timestamp": t1.isoformat(),
    })
    search_idx += 1
    
    t2 = t1 + timedelta(minutes=2)
    browsing.append({
        "event_id": f"BRW-{browse_idx:05d}",
        "customer_id": "CUST-0003",
        "product_id": "PROD-0004",
        "event_type": "view",
        "duration": 185,
        "timestamp": t2.isoformat(),
    })
    browse_idx += 1
    
    t3 = t2 + timedelta(minutes=3)
    cart_events.append({
        "event_id": f"CRT-{cart_idx:05d}",
        "customer_id": "CUST-0003",
        "product_id": "PROD-0004",
        "action": "add",
        "quantity": 1,
        "timestamp": t3.isoformat(),
    })
    cart_idx += 1
    
    t4 = t3 + timedelta(minutes=5)
    cart_events.append({
        "event_id": f"CRT-{cart_idx:05d}",
        "customer_id": "CUST-0003",
        "product_id": "PROD-0004",
        "action": "abandon",
        "quantity": 1,
        "timestamp": t4.isoformat(),
    })
    cart_idx += 1
    # Notice: CUST-0003 never orders PROD-0004 due to price mismatch (Budget tier vs 6499).
    
    # ----------------------------------------------------
    # Seeded Scenario 2: Unavailable Sizes / Out of Stock
    # Customer: CUST-0002 wants PROD-0002 size UK 9 in Mumbai
    # ----------------------------------------------------
    t_sz1 = base_time + timedelta(days=3, hours=14, minutes=0)
    searches.append({
        "event_id": f"SRCH-{search_idx:05d}",
        "customer_id": "CUST-0002",
        "query": "TerraFlex trail climbing shoes UK 9",
        "timestamp": t_sz1.isoformat(),
    })
    search_idx += 1
    
    t_sz2 = t_sz1 + timedelta(minutes=1)
    browsing.append({
        "event_id": f"BRW-{browse_idx:05d}",
        "customer_id": "CUST-0002",
        "product_id": "PROD-0002",
        "event_type": "view",
        "duration": 90,
        "timestamp": t_sz2.isoformat(),
    })
    browse_idx += 1
    
    t_sz3 = t_sz2 + timedelta(minutes=2)
    cart_events.append({
        "event_id": f"CRT-{cart_idx:05d}",
        "customer_id": "CUST-0002",
        "product_id": "PROD-0002",
        "action": "abandon",  # Out of stock in Mumbai STORE-001
        "quantity": 1,
        "timestamp": t_sz3.isoformat(),
    })
    cart_idx += 1
    
    # ----------------------------------------------------
    # Seeded Scenario 3: Sales Decline for PROD-0005
    # High orders in Period 1 (Sep 1-15, Promo active)
    # Drastic drop in Period 2 (Sep 16-30, Promo ended)
    # ----------------------------------------------------
    for d in range(1, 14, 2):
        order_t = base_time + timedelta(days=d, hours=11)
        cust = rng.choice(customers[:5])
        searches.append({
            "event_id": f"SRCH-{search_idx:05d}",
            "customer_id": cust["customer_id"],
            "query": "seamless training tee PulseWear",
            "timestamp": (order_t - timedelta(minutes=15)).isoformat(),
        })
        search_idx += 1
        
        browsing.append({
            "event_id": f"BRW-{browse_idx:05d}",
            "customer_id": cust["customer_id"],
            "product_id": "PROD-0005",
            "event_type": "click",
            "duration": 60,
            "timestamp": (order_t - timedelta(minutes=10)).isoformat(),
        })
        browse_idx += 1
        
        cart_events.append({
            "event_id": f"CRT-{cart_idx:05d}",
            "customer_id": cust["customer_id"],
            "product_id": "PROD-0005",
            "action": "add",
            "quantity": 1,
            "timestamp": (order_t - timedelta(minutes=5)).isoformat(),
        })
        cart_idx += 1
        
        ord_id = f"ORD-{order_idx:05d}"
        orders.append({
            "order_id": ord_id,
            "customer_id": cust["customer_id"],
            "product_id": "PROD-0005",
            "quantity": 1,
            "price": 1499.00,
            "discount": 400.00,  # Active promo discount in Period 1
            "order_date": order_t.isoformat(),
            "channel": "online",
        })
        delivery_events.append({
            "order_id": ord_id,
            "promised_date": (order_t + timedelta(days=3)).strftime("%Y-%m-%d"),
            "actual_date": (order_t + timedelta(days=3)).strftime("%Y-%m-%d"),
            "delay_days": 0,
            "status": "delivered",
        })
        order_idx += 1
    # Period 2 (after Sep 15): only 1 order without discount
    p2_time = base_time + timedelta(days=22, hours=16)
    ord_id = f"ORD-{order_idx:05d}"
    orders.append({
        "order_id": ord_id,
        "customer_id": "CUST-0004",
        "product_id": "PROD-0005",
        "quantity": 1,
        "price": 1499.00,
        "discount": 0.00,  # Promo expired, zero discount
        "order_date": p2_time.isoformat(),
        "channel": "online",
    })
    delivery_events.append({
        "order_id": ord_id,
        "promised_date": (p2_time + timedelta(days=3)).strftime("%Y-%m-%d"),
        "actual_date": (p2_time + timedelta(days=3)).strftime("%Y-%m-%d"),
        "delay_days": 0,
        "status": "delivered",
    })
    order_idx += 1
    
    # ----------------------------------------------------
    # Seeded Scenario 5: High Product Returns for PROD-0006
    # 8 returns with sizing defect reviews
    # ----------------------------------------------------
    defect_reviews = [
        "Runs at least two sizes smaller than labeled. Couldn't zip up.",
        "Chest and arm dimensions are way too tight compared to normal size chart.",
        "Definite sizing discrepancy, ordered L but fits like S.",
        "Sleeves are unusually narrow. Had to return immediately.",
        "Nice fabric but fit is impossible. Much smaller than standard sizing.",
        "Sizing is completely off. Tight in shoulders and chest.",
        "Returned because the medium felt like an extra small.",
        "Poor fit calibration. Very restrictive around underarms.",
    ]
    
    for i, review_msg in enumerate(defect_reviews):
        c_i = customers[i % len(customers)]
        o_date = base_time + timedelta(days=4 + i, hours=12)
        ord_id = f"ORD-{order_idx:05d}"
        orders.append({
            "order_id": ord_id,
            "customer_id": c_i["customer_id"],
            "product_id": "PROD-0006",
            "quantity": 1,
            "price": 3899.00,
            "discount": 0.00,
            "order_date": o_date.isoformat(),
            "channel": "online",
        })
        ret_date = (o_date + timedelta(days=5)).strftime("%Y-%m-%d")
        reviews_returns.append({
            "customer_id": c_i["customer_id"],
            "product_id": "PROD-0006",
            "rating": 1 if i % 2 == 0 else 2,
            "review_text": review_msg,
            "return_flag": True,
            "return_reason": "sizing_issue",
            "date": ret_date,
        })
        delivery_events.append({
            "order_id": ord_id,
            "promised_date": (o_date + timedelta(days=3)).strftime("%Y-%m-%d"),
            "actual_date": (o_date + timedelta(days=3)).strftime("%Y-%m-%d"),
            "delay_days": 0,
            "status": "delivered",
        })
        support_conversations.append({
            "customer_id": c_i["customer_id"],
            "order_id": ord_id,
            "issue_type": "sizing_inquiry",
            "conversation_text": f"Customer reports: '{review_msg}'. Requested return label.",
            "resolution": "refund_issued",
            "timestamp": (o_date + timedelta(days=4)).isoformat(),
        })
        order_idx += 1
        
    # Add 2 satisfied non-return reviews for PROD-0006 to reflect realistic noise
    reviews_returns.append({
        "customer_id": "CUST-0001",
        "product_id": "PROD-0006",
        "rating": 4,
        "review_text": "Good jacket if you size up by one.",
        "return_flag": False,
        "return_reason": "",
        "date": "2026-09-20",
    })
    reviews_returns.append({
        "customer_id": "CUST-0005",
        "product_id": "PROD-0006",
        "rating": 4,
        "review_text": "Kept it for cycling windbreak.",
        "return_flag": False,
        "return_reason": "",
        "date": "2026-09-22",
    })

    # ----------------------------------------------------
    # General Realistic Journeys & Orders across remaining catalog
    # ----------------------------------------------------
    target_orders = 25 * scale_factor
    for _ in range(target_orders):
        cust = rng.choice(customers)
        prod = rng.choice(products)
        day_offset = rng.randint(1, 28)
        event_time = base_time + timedelta(days=day_offset, hours=rng.randint(8, 21), minutes=rng.randint(0, 59))
        
        # Search
        searches.append({
            "event_id": f"SRCH-{search_idx:05d}",
            "customer_id": cust["customer_id"],
            "query": f"{prod['brand']} {prod['subcategory']}",
            "timestamp": event_time.isoformat(),
        })
        search_idx += 1
        
        # Browse
        browsing.append({
            "event_id": f"BRW-{browse_idx:05d}",
            "customer_id": cust["customer_id"],
            "product_id": prod["product_id"],
            "event_type": "view",
            "duration": rng.randint(20, 150),
            "timestamp": (event_time + timedelta(minutes=2)).isoformat(),
        })
        browse_idx += 1
        
        # Cart
        cart_action = "add"
        cart_events.append({
            "event_id": f"CRT-{cart_idx:05d}",
            "customer_id": cust["customer_id"],
            "product_id": prod["product_id"],
            "action": cart_action,
            "quantity": 1,
            "timestamp": (event_time + timedelta(minutes=4)).isoformat(),
        })
        cart_idx += 1
        
        # 70% complete checkout into orders
        if rng.random() < 0.70:
            order_t = event_time + timedelta(minutes=7)
            ord_id = f"ORD-{order_idx:05d}"
            
            # Check promotion
            promo = promo_map.get(prod["product_id"])
            discount_val = 0.00
            if promo and promo["start_date"] <= order_t.strftime("%Y-%m-%d") <= promo["end_date"]:
                discount_val = promo["discount"]
                
            channel_choice = rng.choice(["online", "app", "in-store"])
            orders.append({
                "order_id": ord_id,
                "customer_id": cust["customer_id"],
                "product_id": prod["product_id"],
                "quantity": 1,
                "price": prod["price"],
                "discount": discount_val,
                "order_date": order_t.isoformat(),
                "channel": channel_choice,
            })
            
            # Delivery event
            delay = 0 if rng.random() > 0.15 else rng.randint(1, 4)
            promised = order_t + timedelta(days=3)
            actual = promised + timedelta(days=delay)
            delivery_events.append({
                "order_id": ord_id,
                "promised_date": promised.strftime("%Y-%m-%d"),
                "actual_date": actual.strftime("%Y-%m-%d"),
                "delay_days": delay,
                "status": "delivered" if delay == 0 else "delayed",
            })
            
            # Review / Return
            if rng.random() < 0.35 and prod["product_id"] != "PROD-0006":
                is_return = rng.random() < 0.08  # Normal low return rate
                rating = rng.randint(3, 5) if not is_return else rng.randint(1, 3)
                reason = rng.choice(["sizing_issue", "changed_mind"]) if is_return else ""
                reviews_returns.append({
                    "customer_id": cust["customer_id"],
                    "product_id": prod["product_id"],
                    "rating": rating,
                    "review_text": "Good quality product, meets expectations." if not is_return else "Fit wasn't right for me.",
                    "return_flag": is_return,
                    "return_reason": reason,
                    "date": (order_t + timedelta(days=6)).strftime("%Y-%m-%d"),
                })
            
            order_idx += 1
        else:
            # Abandoned cart
            cart_events.append({
                "event_id": f"CRT-{cart_idx:05d}",
                "customer_id": cust["customer_id"],
                "product_id": prod["product_id"],
                "action": "abandon",
                "quantity": 1,
                "timestamp": (event_time + timedelta(minutes=10)).isoformat(),
            })
            cart_idx += 1

    return {
        "search_events": searches,
        "browsing_events": browsing,
        "cart_events": cart_events,
        "orders": orders,
        "reviews_returns": reviews_returns,
        "delivery_events": delivery_events,
        "support_conversations": support_conversations,
    }


def write_csv(filepath: Path, rows: List[Dict[str, Any]], fieldnames: List[str]) -> None:
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)


def generate_all(
    scale: str = "small",
    seed: int = DEFAULT_SEED,
    output_dir: str = "data/generated",
    include_optional: bool = True,
) -> Dict[str, int]:
    rng = random.Random(seed)
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    
    scale_configs = {
        "small": {"customers": 25, "products": 15, "stores": 5, "scale_factor": 1},
        "large": {"customers": 300, "products": 100, "stores": 15, "scale_factor": 15},
    }
    cfg = scale_configs.get(scale, scale_configs["small"])
    
    print(f"[*] Generating RetailIQ synthetic datasets (Scale: {scale}, Seed: {seed})...")
    
    # 1. Stores
    stores = generate_stores(rng, cfg["stores"])
    write_csv(
        out_path / "stores.csv",
        stores,
        ["store_id", "location", "format", "region"],
    )
    
    # 2. Products
    products = generate_products(rng, cfg["products"])
    write_csv(
        out_path / "products.csv",
        products,
        ["product_id", "product_name", "category", "subcategory", "brand", "price", "rating", "attributes", "description"],
    )
    
    # 3. Customers
    customers = generate_customers(rng, cfg["customers"])
    write_csv(
        out_path / "customers.csv",
        customers,
        ["customer_id", "age_group", "location", "preferred_category", "preferred_brands", "avg_order_value", "price_range", "loyalty_tier"],
    )
    
    # 4. Promotions
    promotions = generate_promotions(rng, products)
    write_csv(
        out_path / "promotions.csv",
        promotions,
        ["product_id", "campaign", "discount", "start_date", "end_date", "channel"],
    )
    
    # 5. Inventory
    inventory = generate_inventory(rng, products, stores)
    write_csv(
        out_path / "inventory.csv",
        inventory,
        ["product_id", "store_id", "stock", "availability_time"],
    )
    
    # 6. Events, Orders, Reviews, Deliveries, Support
    journey_data = generate_events_and_orders(
        rng, customers, products, stores, promotions, cfg["scale_factor"]
    )
    
    write_csv(
        out_path / "search_events.csv",
        journey_data["search_events"],
        ["event_id", "customer_id", "query", "timestamp"],
    )
    
    write_csv(
        out_path / "browsing_events.csv",
        journey_data["browsing_events"],
        ["event_id", "customer_id", "product_id", "event_type", "duration", "timestamp"],
    )
    
    write_csv(
        out_path / "cart_events.csv",
        journey_data["cart_events"],
        ["event_id", "customer_id", "product_id", "action", "quantity", "timestamp"],
    )
    
    write_csv(
        out_path / "orders.csv",
        journey_data["orders"],
        ["order_id", "customer_id", "product_id", "quantity", "price", "discount", "order_date", "channel"],
    )
    
    write_csv(
        out_path / "reviews_returns.csv",
        journey_data["reviews_returns"],
        ["customer_id", "product_id", "rating", "review_text", "return_flag", "return_reason", "date"],
    )
    
    summary = {
        "stores": len(stores),
        "products": len(products),
        "customers": len(customers),
        "promotions": len(promotions),
        "inventory": len(inventory),
        "search_events": len(journey_data["search_events"]),
        "browsing_events": len(journey_data["browsing_events"]),
        "cart_events": len(journey_data["cart_events"]),
        "orders": len(journey_data["orders"]),
        "reviews_returns": len(journey_data["reviews_returns"]),
    }
    
    if include_optional:
        write_csv(
            out_path / "delivery_events.csv",
            journey_data["delivery_events"],
            ["order_id", "promised_date", "actual_date", "delay_days", "status"],
        )
        write_csv(
            out_path / "support_conversations.csv",
            journey_data["support_conversations"],
            ["customer_id", "order_id", "issue_type", "conversation_text", "resolution", "timestamp"],
        )
        summary["delivery_events"] = len(journey_data["delivery_events"])
        summary["support_conversations"] = len(journey_data["support_conversations"])
        
    print(f"[+] Successfully generated datasets in {out_path.resolve()}:")
    for name, cnt in summary.items():
        print(f"    - {name}.csv: {cnt} rows")
        
    return summary


def main():
    parser = argparse.ArgumentParser(description="RetailIQ Synthetic Data Generator")
    parser.add_argument("--scale", choices=["small", "large"], default="small", help="Scale of dataset")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help="Deterministic random seed")
    parser.add_argument("--output-dir", default="data/generated", help="Target output folder")
    parser.add_argument("--no-optional", action="store_true", help="Omit optional delivery and support datasets")
    args = parser.parse_args()
    
    generate_all(
        scale=args.scale,
        seed=args.seed,
        output_dir=args.output_dir,
        include_optional=not args.no_optional,
    )


if __name__ == "__main__":
    main()
