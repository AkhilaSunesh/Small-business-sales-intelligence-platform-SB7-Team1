import pandas as pd
from typing import Dict, Any, Optional
from server.config import DATA_DIR

class ChurnService:
    def __init__(self):
        self.data_path = DATA_DIR / "customer_churn.csv"
        self.improved_data_path = DATA_DIR / "improved_customer_churn.csv"
        self.data: pd.DataFrame = self._load_data()

    def _load_data(self) -> pd.DataFrame:
        for p in [self.improved_data_path, self.data_path]:
            if p.exists():
                try:
                    df = pd.read_csv(p)
                    print(f"[ChurnService] Loaded {len(df)} rows from {p.name}")
                    return df
                except Exception as exc:
                    print(f"[ChurnService] Error loading {p.name}: {exc}")
        return pd.DataFrame(columns=["CustomerID", "ChurnRisk"])

    def get_summary(self) -> Dict[str, Any]:
        if self.data.empty:
            return {"success": False, "message": "No data available"}

        risk_col = "ChurnRisk" if "ChurnRisk" in self.data.columns else self.data.columns[-1]

        distribution = (
            self.data
            .groupby(risk_col)
            .agg(count=("CustomerID", "count"))
            .reset_index()
            .rename(columns={risk_col: "churnRisk"})
        )

        high_risk = self.data[self.data[risk_col].astype(str).str.lower().isin(["high", "1", "true", "at risk"])]

        return {
            "success": True,
            "data": {
                "distribution": distribution.to_dict(orient="records"),
                "totalCustomers": len(self.data),
                "highRiskCount": len(high_risk),
                "highRiskSample": high_risk.head(10).to_dict(orient="records")
            }
        }

    def check_churn(self, customer_id: Any) -> Dict[str, Any]:
        try:
            cid = int(customer_id)
        except (ValueError, TypeError):
            cid = customer_id

        customer = self.data[self.data["CustomerID"] == cid]
        if customer.empty:
            return {"success": False, "message": "Customer not found"}

        result = customer.iloc[0]
        return {
            "success": True,
            "data": {
                "CustomerID": int(result["CustomerID"]) if pd.notna(result["CustomerID"]) else str(result["CustomerID"]),
                "ChurnRisk": result.get("ChurnRisk", "Low")
            }
        }

    def get_by_customer_id(self, customer_id: int) -> Optional[Dict[str, Any]]:
        res = self.check_churn(customer_id)
        if res.get("success"):
            return res.get("data")
        return None

churn_service = ChurnService()
