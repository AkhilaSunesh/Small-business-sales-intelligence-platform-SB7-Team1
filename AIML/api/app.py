from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(
    title="MarketMind AI - Sales Forecast API",
    description="Baseline Sales Forecasting API",
    version="1.0"
)

# LOAD TRAINED MODEL

model = joblib.load("../models/prophet_sales_forecast.pkl")


class ForecastRequest(BaseModel):
    periods: int = 30


@app.get("/")
def home():
    return {
        "message": "MarketMind AI Sales Forecast API is Running"
    }


@app.post("/forecast")
def forecast(request: ForecastRequest):

    future = model.make_future_dataframe(
        periods=request.periods,
        freq="D"
    )

    forecast = model.predict(future)

    result = forecast[["ds", "yhat"]].tail(request.periods)

    return result.to_dict(orient="records")