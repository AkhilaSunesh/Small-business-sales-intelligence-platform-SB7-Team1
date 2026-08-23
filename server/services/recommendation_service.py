import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

# Exact product definitions according to the Kaggle Retail Dataset
# Products A, B, C, D with structured shapes supporting both .name and .product.name
PRODUCTS_CATALOG = [
    {
        "id": "prod-001",
        "productCode": "A",
        "name": "Product A",
        "category": "Electronics",
        "price": 54.94,
        "stock": 123412,
        "quantity": 123412,
        "lowStockThreshold": 100,
        "product": {
            "id": "prod-001",
            "productCode": "A",
            "name": "Product A",
            "category": "Electronics",
            "price": 54.94
        }
    },
    {
        "id": "prod-002",
        "productCode": "B",
        "name": "Product B",
        "category": "Clothing",
        "price": 55.05,
        "stock": 124430,
        "quantity": 124430,
        "lowStockThreshold": 100,
        "product": {
            "id": "prod-002",
            "productCode": "B",
            "name": "Product B",
            "category": "Clothing",
            "price": 55.05
        }
    },
    {
        "id": "prod-003",
        "productCode": "C",
        "name": "Product C",
        "category": "Books",
        "price": 55.15,
        "stock": 125405,
        "quantity": 125405,
        "lowStockThreshold": 100,
        "product": {
            "id": "prod-003",
            "productCode": "C",
            "name": "Product C",
            "category": "Books",
            "price": 55.15
        }
    },
    {
        "id": "prod-004",
        "productCode": "D",
        "name": "Product D",
        "category": "Home Decor",
        "price": 55.10,
        "stock": 125005,
        "quantity": 125005,
        "lowStockThreshold": 100,
        "product": {
            "id": "prod-004",
            "productCode": "D",
            "name": "Product D",
            "category": "Home Decor",
            "price": 55.10
        }
    }
]

class RecommendationService:
    def __init__(self):
        # Precise Association Rules extracted from Kaggle Retail Transactions
        self.rules = [
            {"productId": "A", "recommendedProduct": "Product B", "recommendationRank": 1, "coPurchaseCount": 637, "support": 0.0262},
            {"productId": "A", "recommendedProduct": "Product D", "recommendationRank": 2, "coPurchaseCount": 603, "support": 0.0248},
            {"productId": "A", "recommendedProduct": "Product C", "recommendationRank": 3, "coPurchaseCount": 553, "support": 0.0227},
            {"productId": "B", "recommendedProduct": "Product A", "recommendationRank": 1, "coPurchaseCount": 637, "support": 0.0259},
            {"productId": "B", "recommendedProduct": "Product D", "recommendationRank": 2, "coPurchaseCount": 599, "support": 0.0244},
            {"productId": "B", "recommendedProduct": "Product C", "recommendationRank": 3, "coPurchaseCount": 561, "support": 0.0228},
            {"productId": "C", "recommendedProduct": "Product D", "recommendationRank": 1, "coPurchaseCount": 615, "support": 0.0248},
            {"productId": "C", "recommendedProduct": "Product B", "recommendationRank": 2, "coPurchaseCount": 561, "support": 0.0226},
            {"productId": "C", "recommendedProduct": "Product A", "recommendationRank": 3, "coPurchaseCount": 553, "support": 0.0223},
            {"productId": "D", "recommendedProduct": "Product C", "recommendationRank": 1, "coPurchaseCount": 615, "support": 0.0250},
            {"productId": "D", "recommendedProduct": "Product A", "recommendationRank": 2, "coPurchaseCount": 603, "support": 0.0245},
            {"productId": "D", "recommendedProduct": "Product B", "recommendationRank": 3, "coPurchaseCount": 599, "support": 0.0244}
        ]

    def get_recommendations(self, product_id: Optional[str] = None) -> Dict[str, Any]:
        if product_id:
            pid = str(product_id).replace("Product ", "").strip().upper()
            filtered = [r for r in self.rules if r["productId"] == pid]
            return {
                "success": True,
                "data": filtered,
                "productId": pid,
                "total": len(filtered)
            }
        return {
            "success": True,
            "data": self.rules,
            "total": len(self.rules)
        }

    def recommend_for_product(self, product_id: str) -> Dict[str, Any]:
        pid = str(product_id).replace("Product ", "").strip().upper()
        filtered = [r for r in self.rules if r["productId"] == pid]
        return {
            "success": True,
            "productId": f"Product {pid}",
            "recommendations": filtered
        }

recommendation_service = RecommendationService()
