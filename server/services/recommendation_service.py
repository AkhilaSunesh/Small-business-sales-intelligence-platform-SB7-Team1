import pandas as pd
from typing import Dict, Any, List, Optional
from server.config import DATA_DIR

class RecommendationService:
    def __init__(self):
        self.improved_data = DATA_DIR / "improved_product_recommendations.csv"
        self.fallback_data = DATA_DIR / "product_recommendations.csv"
        self.data: pd.DataFrame = self._load_data()

    def _load_data(self) -> pd.DataFrame:
        for p in [self.improved_data, self.fallback_data]:
            if p.exists():
                try:
                    df = pd.read_csv(p)
                    print(f"[RecommendationService] Loaded {len(df)} rows from {p.name}")
                    return df
                except Exception as exc:
                    print(f"[RecommendationService] Error loading {p.name}: {exc}")
        return pd.DataFrame()

    def _normalize_row(self, row: pd.Series) -> Dict[str, Any]:
        if "RecommendedProduct" in row.index:
            return {
                "productId": str(row["ProductID"]).upper() if pd.notna(row["ProductID"]) else None,
                "recommendedProduct": str(row["RecommendedProduct"]) if pd.notna(row["RecommendedProduct"]) else None,
                "recommendationRank": int(row["RecommendationRank"]) if pd.notna(row.get("RecommendationRank")) else None,
                "coPurchaseCount": int(row["CoPurchaseCount"]) if pd.notna(row.get("CoPurchaseCount")) else None,
                "support": float(row["Support"]) if pd.notna(row.get("Support")) else None
            }
        return {
            "productId": str(row["ProductID"]).upper() if pd.notna(row["ProductID"]) else None,
            "purchaseCount": int(row["PurchaseCount"]) if pd.notna(row.get("PurchaseCount")) else None
        }

    def _normalize_dataframe(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        return [self._normalize_row(row) for _, row in df.iterrows()]

    def get_recommendations(self, product_id: Optional[str] = None) -> Dict[str, Any]:
        if self.data.empty:
            return {"success": False, "message": "No data available", "data": []}

        if product_id:
            pid = str(product_id).upper().strip()
            filtered = self.data[self.data["ProductID"].astype(str).str.upper() == pid]
            if filtered.empty:
                return {
                    "success": True,
                    "data": [],
                    "productId": pid,
                    "message": "No recommendations found for the requested product."
                }
            if "RecommendationRank" in filtered.columns:
                result = filtered.sort_values(by=["RecommendationRank"], ascending=True).head(10)
            else:
                result = filtered.head(10)
        else:
            result = self.data
            if "RecommendationRank" in self.data.columns:
                result = result.sort_values(by=["RecommendationRank"], ascending=True)
            result = result.head(10)

        return {
            "success": True,
            "data": self._normalize_dataframe(result),
            "total": len(result)
        }

    def recommend_for_product(self, product_id: str) -> Dict[str, Any]:
        pid = str(product_id).upper().strip()
        filtered = self.data[self.data["ProductID"].astype(str).str.upper() == pid]
        if filtered.empty:
            return {
                "success": True,
                "productId": pid,
                "recommendations": [],
                "message": "No recommendations found for the requested product."
            }

        if "RecommendationRank" in filtered.columns:
            result = filtered.sort_values(by=["RecommendationRank"], ascending=True).head(5)
        else:
            result = filtered.head(5)

        return {
            "success": True,
            "productId": pid,
            "recommendations": self._normalize_dataframe(result)
        }

recommendation_service = RecommendationService()
