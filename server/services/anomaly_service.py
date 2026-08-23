import os
import joblib
import pandas as pd
from typing import Dict, Any, Optional
from server.config import DATA_DIR, MODELS_DIR

def _safe_float(value, default=None):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

class AnomalyService:
    def __init__(self):
        self.data_path = DATA_DIR / "improved_anomaly_detection.csv"
        self.fallback_data_path = DATA_DIR / "anomaly_detection.csv"
        self.model_path = MODELS_DIR / "improved_anomaly_detection.pkl"
        
        self.data: pd.DataFrame = self._load_data()
        self.model: Optional[Dict[str, Any]] = self._load_model()

    def _load_data(self) -> pd.DataFrame:
        for p in [self.data_path, self.fallback_data_path]:
            if p.exists():
                try:
                    df = pd.read_csv(p, nrows=5000)
                    print(f"[AnomalyService] Loaded sample of {len(df)} rows from {p.name}")
                    return df
                except Exception as exc:
                    print(f"[AnomalyService] Error loading {p.name}: {exc}")
        return pd.DataFrame(columns=["CustomerID", "ProductID", "Quantity", "Price", "TransactionDate", "TotalAmount", "Anomaly"])


    def _load_model(self) -> Optional[Dict[str, Any]]:
        if self.model_path.exists():
            try:
                model = joblib.load(self.model_path)
                print(f"[AnomalyService] Loaded model from {self.model_path.name}")
                return model
            except Exception as exc:
                print(f"[AnomalyService] Error loading model: {exc}")
        return None

    def is_flagged(self, row: pd.Series) -> bool:
        anomaly_value = str(row.get("Anomaly", "")).strip().lower()
        if anomaly_value in {"true", "1", "yes", "anomaly"}:
            return True

        total_amount = _safe_float(row.get("TotalAmount"))
        if total_amount is None or self.model is None:
            return False

        lower = _safe_float(self.model.get("lower_limit"))
        upper = _safe_float(self.model.get("upper_limit"))
        if lower is None or upper is None:
            return False

        return total_amount < lower or total_amount > upper

    def format_record(self, row: pd.Series) -> Dict[str, Any]:
        return {
            "CustomerID": int(row.get("CustomerID")) if pd.notna(row.get("CustomerID")) else None,
            "ProductID": row.get("ProductID"),
            "Quantity": int(row.get("Quantity")) if _safe_float(row.get("Quantity")) is not None else None,
            "Price": _safe_float(row.get("Price")),
            "TransactionDate": row.get("TransactionDate"),
            "TotalAmount": _safe_float(row.get("TotalAmount")),
            "Anomaly": row.get("Anomaly")
        }

    def get_summary(self, limit: int = 20) -> Dict[str, Any]:
        if self.data.empty:
            return {"success": False, "message": "No data available", "data": []}

        flagged = self.data[self.data.apply(self.is_flagged, axis=1)]
        return {
            "success": True,
            "data": [self.format_record(row) for _, row in flagged.head(limit).iterrows()],
            "totalAnomalies": len(flagged),
            "totalRecords": len(self.data),
            "thresholds": {
                "lowerLimit": _safe_float(self.model.get("lower_limit")) if self.model else None,
                "upperLimit": _safe_float(self.model.get("upper_limit")) if self.model else None,
                "method": self.model.get("method") if self.model else None,
                "multiplier": _safe_float(self.model.get("multiplier")) if self.model else None
            }
        }

    def check_anomaly(self, customer_id: Optional[int] = None, total_amount: Optional[float] = None) -> Dict[str, Any]:
        if customer_id is not None:
            customer = self.data[self.data["CustomerID"] == customer_id]
            if not customer.empty:
                result = customer.iloc[0]
                is_anomaly = self.is_flagged(result)
                return {
                    "success": True,
                    "data": self.format_record(result),
                    "isAnomaly": is_anomaly
                }

        if total_amount is None:
            return {"success": False, "message": "customerId or totalAmount is required"}

        lower = _safe_float(self.model.get("lower_limit")) if self.model else None
        upper = _safe_float(self.model.get("upper_limit")) if self.model else None
        if lower is None or upper is None:
            return {"success": False, "message": "Anomaly model is unavailable"}

        is_anomaly = total_amount < lower or total_amount > upper
        return {
            "success": True,
            "data": {
                "TotalAmount": total_amount,
                "thresholdLower": lower,
                "thresholdUpper": upper,
                "isAnomaly": is_anomaly
            }
        }

    def get_by_customer_id(self, customer_id: int) -> Optional[Dict[str, Any]]:
        customer = self.data[self.data["CustomerID"] == customer_id]
        if customer.empty:
            return None
        result = customer.iloc[0]
        return {
            "CustomerID": int(result["CustomerID"]),
            "Anomaly": result.get("Anomaly"),
            "TotalAmount": float(result.get("TotalAmount", 0.0))
        }

anomaly_service = AnomalyService()
