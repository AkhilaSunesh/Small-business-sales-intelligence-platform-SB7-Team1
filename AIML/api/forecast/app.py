"""
Sales Forecast API
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
    description="Improved sales forecasting using the latest trained model",
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
_MODEL = os.path.join(_BASE, "..", "..", "models", "improved_sales_forecast.pkl")

try:
    model = joblib.load(_MODEL)
    print(f"[forecast] Improved sales forecast model loaded from {_MODEL}")
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

    future = model.make_future_dataframe(periods=days, freq="D")
    forecast = model.predict(future)
    result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(days)

    records = []
    for _, row in result.iterrows():
        yhat = float(row["yhat"])
        lower = float(row["yhat_lower"])
        upper = float(row["yhat_upper"])
        width = max(0.0, upper - lower)
        base = max(abs(yhat), 1.0)
        confidence = round(max(25.0, min(99.0, 100.0 - (width / base) * 100.0)), 1)

        records.append({
            "date": row["ds"].strftime("%Y-%m-%d"),
            "forecastRevenue": round(yhat, 2),
            "lowerBound": round(lower, 2),
            "upperBound": round(upper, 2),
            "confidence": confidence
        })

    average_confidence = (
        round(float(sum(item["confidence"] for item in records) / len(records)), 1)
        if records else None
    )

    response = {
        "success": True,
        "period": days,
        "generatedAt": pd.Timestamp.now().isoformat(),
        "forecast": records
    }
    if average_confidence is not None:
        response["confidence"] = average_confidence

    return response


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
