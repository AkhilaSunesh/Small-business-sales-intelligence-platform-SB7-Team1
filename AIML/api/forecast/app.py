"""
Sales Forecast API  (FastAPI + Prophet)
Port: 5014
Gateway route: GET /api/forecast → http://localhost:5014/forecast

The gateway forwards GET /api/forecast?days=30 here as GET /forecast?days=30.
A POST /forecast endpoint is also kept for backward compatibility.
"""

import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(
    title="MarketMind AI — Sales Forecast API",
    description="Baseline Sales Forecasting with Prophet",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model loading ─────────────────────────────────────────────────────────────
_BASE  = os.path.dirname(os.path.abspath(__file__))
_MODEL = os.path.join(_BASE, "..", "..", "models", "prophet_sales_forecast.pkl")

try:
    model = joblib.load(_MODEL)
    print(f"[forecast] Prophet model loaded from {_MODEL}")
    _MODEL_LOADED = True
except Exception as e:
    print(f"[forecast] WARNING: could not load model — {e}")
    model = None
    _MODEL_LOADED = False


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/")
def home():
    return {
        "success": True,
        "message": "MarketMind AI Sales Forecast API is Running",
        "modelLoaded": _MODEL_LOADED
    }


# ── Gateway-compatible GET /forecast ─────────────────────────────────────────
# Called by Security_API_gateway at GET /api/forecast?days=30
@app.get("/forecast")
def forecast_get(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to forecast")
):
    if not _MODEL_LOADED or model is None:
        return {
            "success": False,
            "message": "Forecast model is not loaded.",
            "forecast": [],
            "period": days
        }

    future   = model.make_future_dataframe(periods=days, freq="D")
    forecast = model.predict(future)
    result   = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(days)

    # Convert Timestamps to ISO strings for JSON serialisation
    records = []
    for _, row in result.iterrows():
        records.append({
            "date":           row["ds"].strftime("%Y-%m-%d"),
            "forecastRevenue": round(float(row["yhat"]), 2),
            "lowerBound":     round(float(row["yhat_lower"]), 2),
            "upperBound":     round(float(row["yhat_upper"]), 2)
        })

    return {
        "success":     True,
        "period":      days,
        "generatedAt": pd.Timestamp.now().isoformat(),
        "forecast":    records
    }


# ── Original POST /forecast (kept for backward compatibility) ─────────────────
class ForecastRequest(BaseModel):
    periods: int = 30


@app.post("/forecast")
def forecast_post(request: ForecastRequest):
    if not _MODEL_LOADED or model is None:
        return {"success": False, "message": "Forecast model is not loaded.", "forecast": []}

    future   = model.make_future_dataframe(periods=request.periods, freq="D")
    forecast = model.predict(future)
    result   = forecast[["ds", "yhat"]].tail(request.periods)
    return result.to_dict(orient="records")


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5014, reload=True)
