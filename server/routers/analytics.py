from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Analytics & Dashboard"])

@router.get("/dashboard/summary")
def get_dashboard_summary():
    return {
        "success": True,
        "data": {
            "totalRevenue": 142850.75,
            "totalOrders": 1280,
            "activeCustomers": 450,
            "lowStockAlerts": 4,
            "revenueGrowth": "+14.2%",
            "topSellingCategory": "Electronics"
        }
    }

@router.get("/analytics/sales-trend")
def get_sales_trend():
    return {
        "success": True,
        "data": [
            {"month": "Jan", "sales": 12500, "target": 10000},
            {"month": "Feb", "sales": 14200, "target": 11000},
            {"month": "Mar", "sales": 18900, "target": 13000},
            {"month": "Apr", "sales": 16400, "target": 14000},
            {"month": "May", "sales": 21000, "target": 16000},
            {"month": "Jun", "sales": 24500, "target": 18000}
        ]
    }

@router.get("/inventory")
def get_inventory():
    return {
        "success": True,
        "data": [
            {"id": "PROD-001", "productCode": "P-101", "name": "Wireless Noise Cancelling Headphones", "category": "Electronics", "price": 149.99, "stock": 42, "lowStockThreshold": 10},
            {"id": "PROD-002", "productCode": "P-102", "name": "Ergonomic Mechanical Keyboard", "category": "Electronics", "price": 89.50, "stock": 5, "lowStockThreshold": 10},
            {"id": "PROD-003", "productCode": "P-103", "name": "Organic Cotton Crewneck T-Shirt", "category": "Apparel", "price": 24.00, "stock": 120, "lowStockThreshold": 20},
            {"id": "PROD-004", "productCode": "P-104", "name": "Stainless Steel Thermal Water Bottle", "category": "Accessories", "price": 19.95, "stock": 8, "lowStockThreshold": 15}
        ]
    }

@router.get("/notifications")
def get_notifications():
    return {
        "success": True,
        "data": [
            {"id": "NOTIF-1", "type": "warning", "message": "Low stock alert: Ergonomic Mechanical Keyboard (5 remaining)", "timestamp": datetime.now().isoformat()},
            {"id": "NOTIF-2", "type": "info", "message": "Prophet model updated with latest weekly batch", "timestamp": datetime.now().isoformat()}
        ]
    }
