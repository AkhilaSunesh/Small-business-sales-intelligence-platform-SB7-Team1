from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api", tags=["Dashboard & Analytics & System"])

# ─── GET /api/dashboard/summary ───────────────────────────────────────────────
@router.get("/dashboard/summary")
def get_dashboard_summary(
    range: str = Query(default="30d"),
    category: str = Query(default="all"),
    startDate: Optional[str] = None,
    endDate: Optional[str] = None
):
    return {
        "success": True,
        "data": {
            "totalRevenue": 284520.50,
            "totalOrders": 1845,
            "totalSales": 1845,
            "totalCustomers": 94724,
            "avgOrderValue": 154.21,
            "activeProducts": 48
        }
    }

# ─── GET /api/dashboard/total-revenue ─────────────────────────────────────────
@router.get("/dashboard/total-revenue")
def get_total_revenue():
    return {
        "success": True,
        "data": {
            "totalRevenue": 284520.50
        }
    }

# ─── GET /api/dashboard/sales-trend ───────────────────────────────────────────
@router.get("/dashboard/sales-trend")
def get_sales_trend(
    range: str = Query(default="30d"),
    category: str = Query(default="all"),
    startDate: Optional[str] = None,
    endDate: Optional[str] = None
):
    days_map = {"7d": 7, "30d": 30, "90d": 90, "3m": 90, "6m": 180, "1y": 365, "today": 1}
    num_days = days_map.get(range, 30)

    trend = []
    base_val = 1450.0
    now = datetime.now()

    for i in range(num_days, -1, -1):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        revenue = round(base_val + (i % 7 * 45.0) + ((num_days - i) * 12.0), 2)
        transactions = 15 + (i % 5)
        quantity = transactions * 2
        trend.append({
            "date": d,
            "revenue": revenue,
            "transactions": transactions,
            "quantity": quantity
        })

    return {
        "success": True,
        "data": trend,
        "range": range,
        "days": num_days
    }

# ─── GET /api/dashboard/top-products ──────────────────────────────────────────
@router.get("/dashboard/top-products")
def get_top_products(
    range: str = Query(default="30d"),
    limit: int = Query(default=5)
):
    return {
        "success": True,
        "data": [
            {"productId": "P-101", "product": "Wireless Headphones", "productName": "Wireless Headphones", "category": "Electronics", "quantitySold": 340, "revenue": 50966.0},
            {"productId": "P-102", "product": "Mechanical Keyboard", "productName": "Mechanical Keyboard", "category": "Electronics", "quantitySold": 210, "revenue": 18795.0},
            {"productId": "P-103", "product": "Organic Cotton Tee", "productName": "Organic Cotton Tee", "category": "Apparel", "quantitySold": 580, "revenue": 13920.0},
            {"productId": "P-104", "product": "Thermal Bottle", "productName": "Thermal Bottle", "category": "Accessories", "quantitySold": 410, "revenue": 8179.5},
            {"productId": "P-105", "product": "Smart Fitness Band", "productName": "Smart Fitness Band", "category": "Electronics", "quantitySold": 190, "revenue": 9481.0}
        ][:limit]
    }

# ─── GET /api/analytics/payment-methods ───────────────────────────────────────
@router.get("/analytics/payment-methods")
def get_payment_methods():
    return {
        "success": True,
        "data": [
            {"method": "CARD", "count": 850, "revenue": 145000.0},
            {"method": "ONLINE", "count": 520, "revenue": 89000.0},
            {"method": "CASH", "count": 310, "revenue": 34500.0},
            {"method": "BANK_TRANSFER", "count": 165, "revenue": 16020.5}
        ]
    }

# ─── GET /api/analytics/categories ───────────────────────────────────────────
@router.get("/analytics/categories")
def get_category_breakdown():
    return {
        "success": True,
        "data": [
            {"name": "Electronics", "value": 115000.0, "quantity": 1240},
            {"name": "Apparel", "value": 68000.0, "quantity": 2800},
            {"name": "Accessories", "value": 45000.0, "quantity": 1950},
            {"name": "Home & Kitchen", "value": 36000.0, "quantity": 890},
            {"name": "Books", "value": 20520.5, "quantity": 1120}
        ]
    }

# ─── GET /api/audit-summary ──────────────────────────────────────────────────
@router.get("/audit-summary")
def get_audit_summary(limit: int = Query(default=10)):
    return {
        "success": True,
        "data": [
            {"id": "AUD-01", "action": "User Login", "user": "System Admin", "status": "Success", "ip": "127.0.0.1", "timestamp": datetime.now().isoformat()},
            {"id": "AUD-02", "action": "AI Report Requested", "user": "Store Manager", "status": "Success", "ip": "127.0.0.1", "timestamp": (datetime.now() - timedelta(minutes=5)).isoformat()},
            {"id": "AUD-03", "action": "Forecast Model Loaded", "user": "System", "status": "Success", "ip": "127.0.0.1", "timestamp": (datetime.now() - timedelta(minutes=15)).isoformat()}
        ][:limit]
    }

# ─── GET /api/notifications ──────────────────────────────────────────────────
@router.get("/notifications")
def get_notifications(page: int = 1, limit: int = 20):
    return {
        "success": True,
        "data": [
            {"id": "NOTIF-1", "type": "warning", "message": "Low stock alert: Ergonomic Mechanical Keyboard (5 remaining)", "timestamp": datetime.now().isoformat()},
            {"id": "NOTIF-2", "type": "info", "message": "Prophet model updated with latest weekly batch", "timestamp": datetime.now().isoformat()}
        ]
    }

@router.get("/notifications/counts")
def get_notifications_counts():
    return {
        "success": True,
        "data": {
            "total": 2,
            "unread": 2,
            "lowStock": 1,
            "overdue": 0
        }
    }

@router.get("/notifications/low-stock")
def get_notifications_low_stock():
    return {
        "success": True,
        "data": [
            {"id": "PROD-002", "name": "Ergonomic Mechanical Keyboard", "stock": 5, "lowStockThreshold": 10}
        ]
    }

@router.get("/notifications/overdue-invoices")
def get_notifications_overdue():
    return {
        "success": True,
        "data": []
    }

# ─── GET /api/inventory ───────────────────────────────────────────────────────
@router.get("/inventory")
def get_inventory(limit: int = Query(default=100)):
    return {
        "success": True,
        "data": [
            {"id": "PROD-001", "productCode": "P-101", "name": "Wireless Noise Cancelling Headphones", "category": "Electronics", "price": 149.99, "stock": 42, "quantity": 42, "lowStockThreshold": 10},
            {"id": "PROD-002", "productCode": "P-102", "name": "Ergonomic Mechanical Keyboard", "category": "Electronics", "price": 89.50, "stock": 5, "quantity": 5, "lowStockThreshold": 10},
            {"id": "PROD-003", "productCode": "P-103", "name": "Organic Cotton Crewneck T-Shirt", "category": "Apparel", "price": 24.00, "stock": 120, "quantity": 120, "lowStockThreshold": 20},
            {"id": "PROD-004", "productCode": "P-104", "name": "Stainless Steel Thermal Water Bottle", "category": "Accessories", "price": 19.95, "stock": 8, "quantity": 8, "lowStockThreshold": 15}
        ]
    }

# ─── GET /api/products ────────────────────────────────────────────────────────
@router.get("/products")
def get_products():
    return get_inventory()

@router.get("/products/with-stock")
def get_products_with_stock():
    return get_inventory()

# ─── GET /api/customers ───────────────────────────────────────────────────────
@router.get("/customers")
def get_customers(limit: int = Query(default=50)):
    from server.services.segmentation_service import segmentation_service
    summary = segmentation_service.get_summary()
    return {
        "success": True,
        "data": summary.get("customers", [])[:limit]
    }

# ─── GET /api/users ───────────────────────────────────────────────────────────
@router.get("/users")
def get_users(limit: int = Query(default=100), page: int = Query(default=1)):
    from server.routers.auth import MOCK_USERS
    users_list = []
    for u in MOCK_USERS.values():
        users_list.append({
            "id": u["id"],
            "name": u["name"],
            "email": u["email"],
            "roleId": u["roleId"],
            "role": u.get("role", "User"),
            "status": "Active" if u.get("isActive") else "Inactive",
            "lastLogin": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    return {
        "success": True,
        "data": users_list,
        "pagination": {
            "total": len(users_list),
            "page": page,
            "limit": limit,
            "totalPages": 1
        }
    }

# ─── GET /api/sales ───────────────────────────────────────────────────────────
@router.get("/sales")
def get_sales(limit: int = Query(default=50)):
    return {
        "success": True,
        "data": [
            {"id": "TX-001", "invoiceNo": "INV-1001", "customer": "Customer 1024", "product": "Wireless Headphones", "quantity": 2, "totalAmount": 299.98, "date": "2024-05-12"},
            {"id": "TX-002", "invoiceNo": "INV-1002", "customer": "Customer 2056", "product": "Mechanical Keyboard", "quantity": 1, "totalAmount": 89.50, "date": "2024-05-13"}
        ]
    }

# ─── GET /api/invoices ────────────────────────────────────────────────────────
@router.get("/invoices")
def get_invoices(limit: int = Query(default=50)):
    return {
        "success": True,
        "data": [
            {"id": "INV-001", "invoiceNumber": "INV-2024-001", "customerName": "Acme Corp", "totalAmount": 450.00, "status": "PAID", "dueDate": "2024-06-01"},
            {"id": "INV-002", "invoiceNumber": "INV-2024-002", "customerName": "Stark Retail", "totalAmount": 890.50, "status": "UNPAID", "dueDate": "2024-06-15"}
        ]
    }

@router.get("/invoices/revenue/summary")
def get_invoices_revenue_summary():
    return {
        "success": True,
        "data": {
            "totalRevenue": 284520.50,
            "paidRevenue": 240000.00,
            "unpaidRevenue": 44520.50
        }
    }
