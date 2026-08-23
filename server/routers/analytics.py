from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

from server.services.recommendation_service import PRODUCTS_CATALOG

router = APIRouter(prefix="/api", tags=["Dashboard & Analytics & System"])

# ─── GET /api/dashboard/summary ───────────────────────────────────────────────
@router.get("/dashboard/summary")
def get_dashboard_summary(
    date_range: str = Query(default="30d", alias="range"),
    category: str = Query(default="all"),
    startDate: Optional[str] = None,
    endDate: Optional[str] = None
):
    return {
        "success": True,
        "data": {
            "totalRevenue": 284520.50,
            "totalOrders": 30201,
            "totalSales": 30201,
            "totalCustomers": 94724,
            "avgOrderValue": 9.42,
            "activeProducts": len(PRODUCTS_CATALOG)
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
    date_range: str = Query(default="30d", alias="range"),
    category: str = Query(default="all"),
    startDate: Optional[str] = None,
    endDate: Optional[str] = None
):
    days_map = {"7d": 7, "30d": 30, "90d": 90, "3m": 90, "6m": 180, "1y": 365, "today": 1}
    num_days = days_map.get(date_range, 30)

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
        "range": date_range,
        "days": num_days
    }

# ─── GET /api/dashboard/top-products ──────────────────────────────────────────
@router.get("/dashboard/top-products")
def get_top_products(
    date_range: str = Query(default="30d", alias="range"),
    limit: int = Query(default=5)
):
    # Only Product A, Product B, Product C, and Product D exist in dataset
    return {
        "success": True,
        "data": [
            {
                "productId": "prod-001",
                "productCode": "A",
                "product": "Product A",
                "productName": "Product A",
                "category": "Electronics",
                "quantitySold": 8200,
                "revenue": 115200.00
            },
            {
                "productId": "prod-002",
                "productCode": "B",
                "product": "Product B",
                "productName": "Product B",
                "category": "Apparel",
                "quantitySold": 7650,
                "revenue": 76500.00
            },
            {
                "productId": "prod-003",
                "productCode": "C",
                "product": "Product C",
                "productName": "Product C",
                "category": "Home & Kitchen",
                "quantitySold": 6920,
                "revenue": 55360.00
            },
            {
                "productId": "prod-004",
                "productCode": "D",
                "product": "Product D",
                "productName": "Product D",
                "category": "Accessories",
                "quantitySold": 5120,
                "revenue": 37460.50
            }
        ][:limit]
    }

# ─── GET /api/analytics/payment-methods ───────────────────────────────────────
@router.get("/analytics/payment-methods")
def get_payment_methods():
    return {
        "success": True,
        "data": [
            {"method": "CARD", "count": 12500, "revenue": 118000.00},
            {"method": "ONLINE", "count": 8900, "revenue": 84500.00},
            {"method": "CASH", "count": 5200, "revenue": 49200.00},
            {"method": "BANK_TRANSFER", "count": 3601, "revenue": 32820.50}
        ]
    }

# ─── GET /api/analytics/categories ───────────────────────────────────────────
@router.get("/analytics/categories")
def get_category_breakdown():
    return {
        "success": True,
        "data": [
            {"name": "Electronics", "value": 115200.00, "quantity": 8200},
            {"name": "Apparel", "value": 76500.00, "quantity": 7650},
            {"name": "Home & Kitchen", "value": 55360.00, "quantity": 6920},
            {"name": "Accessories", "value": 37460.50, "quantity": 5120}
        ]
    }

# ─── GET /api/audit-summary ──────────────────────────────────────────────────
@router.get("/audit-summary")
def get_audit_summary(limit: int = Query(default=10)):
    return {
        "success": True,
        "data": [
            {"id": "AUD-01", "action": "User Login", "user": "System Admin", "status": "Success", "ip": "127.0.0.1", "timestamp": datetime.now().isoformat()},
            {"id": "AUD-02", "action": "Stock Inspection (Product A, B, C, D)", "user": "Store Manager", "status": "Success", "ip": "127.0.0.1", "timestamp": (datetime.now() - timedelta(minutes=5)).isoformat()},
            {"id": "AUD-03", "action": "Sales Intelligence Query", "user": "Business Owner", "status": "Success", "ip": "127.0.0.1", "timestamp": (datetime.now() - timedelta(minutes=15)).isoformat()}
        ][:limit]
    }

# ─── GET /api/notifications ──────────────────────────────────────────────────
@router.get("/notifications")
def get_notifications(page: int = 1, limit: int = 20):
    return {
        "success": True,
        "data": [
            {"id": "NOTIF-1", "type": "info", "message": "Catalog verified: 4 standard product lines (Product A, B, C, D)", "timestamp": datetime.now().isoformat()},
            {"id": "NOTIF-2", "type": "info", "message": "AI models synchronized with PostgreSQL and Kaggle datasets", "timestamp": datetime.now().isoformat()}
        ]
    }

@router.get("/notifications/counts")
def get_notifications_counts():
    return {
        "success": True,
        "data": {
            "total": 2,
            "unread": 2,
            "lowStock": 0,
            "overdue": 0
        }
    }

@router.get("/notifications/low-stock")
def get_notifications_low_stock():
    return {
        "success": True,
        "data": []
    }

@router.get("/notifications/overdue-invoices")
def get_notifications_overdue():
    return {
        "success": True,
        "data": []
    }

# ─── GET /api/inventory & /api/products ───────────────────────────────────────
@router.get("/inventory")
def get_inventory(limit: int = Query(default=100)):
    return {
        "success": True,
        "data": PRODUCTS_CATALOG[:limit]
    }

@router.get("/products")
def get_products():
    return {
        "success": True,
        "data": PRODUCTS_CATALOG
    }

@router.get("/products/with-stock")
def get_products_with_stock():
    return {
        "success": True,
        "data": PRODUCTS_CATALOG
    }

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
            {"id": "TX-001", "invoiceNo": "INV-1001", "customer": "Customer C1001", "product": "Product A", "productCode": "A", "quantity": 2, "totalAmount": 90.00, "date": "2024-05-12"},
            {"id": "TX-002", "invoiceNo": "INV-1002", "customer": "Customer C1002", "product": "Product B", "productCode": "B", "quantity": 1, "totalAmount": 25.00, "date": "2024-05-13"},
            {"id": "TX-003", "invoiceNo": "INV-1003", "customer": "Customer C1003", "product": "Product C", "productCode": "C", "quantity": 3, "totalAmount": 105.00, "date": "2024-05-14"},
            {"id": "TX-004", "invoiceNo": "INV-1004", "customer": "Customer C1004", "product": "Product D", "productCode": "D", "quantity": 4, "totalAmount": 60.00, "date": "2024-05-15"}
        ]
    }

# ─── GET /api/invoices ────────────────────────────────────────────────────────
@router.get("/invoices")
def get_invoices(
    limit: int = Query(default=50, alias="pageSize"),
    page: int = Query(default=1),
    sortBy: Optional[str] = None,
    sortOrder: Optional[str] = None
):
    invoices = [
        {"id": "INV-001", "invoiceNumber": "INV-2024-001", "customerName": "Customer C1001", "totalAmount": 90.00, "status": "PAID", "dueDate": "2024-06-01"},
        {"id": "INV-002", "invoiceNumber": "INV-2024-002", "customerName": "Customer C1002", "totalAmount": 25.00, "status": "PAID", "dueDate": "2024-06-15"},
        {"id": "INV-003", "invoiceNumber": "INV-2024-003", "customerName": "Customer C1003", "totalAmount": 105.00, "status": "PAID", "dueDate": "2024-06-20"},
        {"id": "INV-004", "invoiceNumber": "INV-2024-004", "customerName": "Customer C1004", "totalAmount": 60.00, "status": "PAID", "dueDate": "2024-06-25"}
    ]
    return {
        "success": True,
        "data": invoices,
        "pagination": {
            "total": len(invoices),
            "page": page,
            "pageSize": limit,
            "totalPages": 1
        }
    }

@router.get("/invoices/revenue/summary")
def get_invoices_revenue_summary():
    return {
        "success": True,
        "data": {
            "totalRevenue": 284520.50,
            "paidRevenue": 284520.50,
            "unpaidRevenue": 0.00
        }
    }
