import joblib
import pandas as pd
from typing import Dict, Any, List, Optional
from server.config import DATA_DIR, MODELS_DIR

def _safe_float(value, default=None):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

class SegmentationService:
    FEATURE_COLUMNS = [
        "TotalSpent",
        "QuantityPurchased",
        "Frequency",
        "AverageOrderValue",
        "AverageQuantityPerTransaction",
        "Recency"
    ]
    GROUP_COLUMN = "CustomerGroup"

    def __init__(self):
        self.improved_data = DATA_DIR / "improved_customer_segmentation.csv"
        self.fallback_data = DATA_DIR / "customer_segmentation.csv"
        self.model_path = MODELS_DIR / "improved_customer_segmentation.pkl"

        self.data: pd.DataFrame = self._load_data()
        self.model = self._load_model()
        self.cluster_to_category = self._cluster_category_mapping()

    def _load_data(self) -> pd.DataFrame:
        for p in [self.improved_data, self.fallback_data]:
            if p.exists():
                try:
                    df = pd.read_csv(p, nrows=5000)
                    print(f"[SegmentationService] Loaded sample of {len(df)} rows from {p.name}")
                    if self.GROUP_COLUMN in df.columns and df[self.GROUP_COLUMN].dtype.kind in "ifu":
                        df[self.GROUP_COLUMN] = df[self.GROUP_COLUMN].astype(int)
                    return df
                except Exception as exc:
                    print(f"[SegmentationService] Error loading {p.name}: {exc}")
        return pd.DataFrame(columns=["CustomerID", "TotalSpent", "QuantityPurchased", "Frequency", "AverageOrderValue", "AverageQuantityPerTransaction", "Recency", self.GROUP_COLUMN])


    def _load_model(self):
        if self.model_path.exists():
            try:
                model = joblib.load(self.model_path)
                print(f"[SegmentationService] Loaded model from {self.model_path.name}")
                return model
            except Exception as exc:
                print(f"[SegmentationService] Error loading model: {exc}")
        return None

    def _cluster_category_mapping(self) -> Dict[int, str]:
        default_mapping = {0: "Occasional", 1: "Loyal", 2: "High Value"}
        if self.model is None or not hasattr(self.model, "cluster_centers_"):
            return default_mapping

        centers = self.model.cluster_centers_
        if centers.shape[1] < len(self.FEATURE_COLUMNS):
            return default_mapping

        totals = centers[:, self.FEATURE_COLUMNS.index("TotalSpent")]
        freqs = centers[:, self.FEATURE_COLUMNS.index("Frequency")]
        recencies = centers[:, self.FEATURE_COLUMNS.index("Recency")]
        indexes = list(range(len(centers)))

        loyal_cluster = max(indexes, key=lambda idx: (freqs[idx], totals[idx], -recencies[idx]))
        remaining = [idx for idx in indexes if idx != loyal_cluster]
        high_value_cluster = max(remaining, key=lambda idx: (totals[idx], -freqs[idx], -recencies[idx]))
        occasional_cluster = next(idx for idx in indexes if idx not in {loyal_cluster, high_value_cluster})

        return {
            loyal_cluster: "Loyal",
            high_value_cluster: "High Value",
            occasional_cluster: "Occasional"
        }

    def group_name(self, group_id: Any) -> str:
        if pd.isna(group_id):
            return "Unknown"
        if isinstance(group_id, str):
            return group_id
        try:
            cluster = int(group_id)
        except (ValueError, TypeError):
            return str(group_id)
        return self.cluster_to_category.get(cluster, f"Cluster {cluster}")

    def format_customer_row(self, row: pd.Series) -> Dict[str, Any]:
        customer_id = row.get("CustomerID")
        display_id = None
        display_name = "Unknown"
        if pd.notna(customer_id):
            try:
                numeric_id = int(customer_id)
                display_id = f"CUST-{numeric_id:04d}"
                display_name = f"Customer {numeric_id}"
            except (ValueError, TypeError):
                display_id = str(customer_id)
                display_name = f"Customer {customer_id}"

        return {
            "id": display_id,
            "name": display_name,
            "category": self.group_name(row.get(self.GROUP_COLUMN)),
            "totalOrders": int(row.get("Frequency")) if _safe_float(row.get("Frequency")) is not None else None,
            "totalSpent": _safe_float(row.get("TotalSpent")),
            "recency": int(row.get("Recency")) if _safe_float(row.get("Recency")) is not None else None
        }

    def get_summary(self) -> Dict[str, Any]:
        if self.data.empty:
            return {"success": False, "message": "No data available"}

        groups = (
            self.data
            .groupby(self.GROUP_COLUMN)
            .agg(count=("CustomerID", "count"))
            .reset_index()
        )

        summary = {"loyalCount": 0, "occasionalCount": 0, "highValueCount": 0}
        distribution = []
        color_map = {
            "Loyal": "#10b981",
            "Occasional": "#f59e0b",
            "High Value": "#06b6d4",
            "Unknown": "#64748b"
        }

        for _, row in groups.iterrows():
            category = self.group_name(row[self.GROUP_COLUMN])
            count = int(row["count"])
            distribution.append({
                "name": category,
                "value": count,
                "color": color_map.get(category, "#64748b")
            })
            if category == "Loyal":
                summary["loyalCount"] = count
            elif category == "Occasional":
                summary["occasionalCount"] = count
            elif category == "High Value":
                summary["highValueCount"] = count

        for category in ["Loyal", "Occasional", "High Value"]:
            if not any(item["name"] == category for item in distribution):
                distribution.append({
                    "name": category,
                    "value": 0,
                    "color": color_map[category]
                })

        mixed_customers = pd.DataFrame()
        for cluster_id in self.cluster_to_category.keys():
            subset = self.data[self.data[self.GROUP_COLUMN] == cluster_id]
            top_subset = subset.sort_values(by=["Frequency", "TotalSpent"], ascending=[False, False]).head(20)
            mixed_customers = pd.concat([mixed_customers, top_subset])

        customers = [
            self.format_customer_row(row)
            for _, row in mixed_customers.iterrows()
        ]

        return {
            "success": True,
            "summary": summary,
            "distribution": distribution,
            "customers": customers,
            "totalCustomers": len(self.data)
        }

    def classify_customer(self, customer_id: Optional[Any] = None, features: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if customer_id is not None:
            try:
                cid = int(customer_id)
            except (ValueError, TypeError):
                cid = customer_id

            customer = self.data[self.data["CustomerID"] == cid]
            if not customer.empty:
                row = customer.iloc[0]
                return {
                    "success": True,
                    "data": {
                        "CustomerID": int(row["CustomerID"]) if pd.notna(row["CustomerID"]) else None,
                        "CustomerGroup": int(row[self.GROUP_COLUMN]) if pd.notna(row[self.GROUP_COLUMN]) else None,
                        "category": self.group_name(row[self.GROUP_COLUMN])
                    }
                }

        if self.model is None:
            return {"success": False, "message": "No matching customer found and segmentation model is unavailable"}

        feature_dict = features or {}
        feature_values = []
        for field in self.FEATURE_COLUMNS:
            value = feature_dict.get(field) or feature_dict.get(field.lower())
            if value is None:
                return {"success": False, "message": f"{field} is required for segmentation classification."}
            num_val = _safe_float(value)
            if num_val is None:
                return {"success": False, "message": f"{field} must be numeric."}
            feature_values.append(num_val)

        try:
            cluster_id = int(self.model.predict([feature_values])[0])
            return {
                "success": True,
                "data": {
                    "CustomerGroup": cluster_id,
                    "category": self.group_name(cluster_id),
                    "features": dict(zip(self.FEATURE_COLUMNS, feature_values))
                }
            }
        except Exception as exc:
            return {"success": False, "message": f"Segmentation prediction failed: {exc}"}

segmentation_service = SegmentationService()
