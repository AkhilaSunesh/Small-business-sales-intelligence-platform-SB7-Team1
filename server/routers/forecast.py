from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from server.services.forecast_service import forecast_service

router = APIRouter(prefix="/api/forecast", tags=["Sales Forecasting"])

class ForecastPostRequest(BaseModel):
    periods: int = 30
    days: Optional[int] = None
    lookback: Optional[int] = 90
    window: Optional[int] = 7

@router.get("")
@router.get("/")
def get_forecast(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to forecast"),
    lookback: int = Query(default=90, ge=7, le=365),
    window: int = Query(default=7, ge=2, le=30),
    category: str = Query(default="all")
):
    return forecast_service.get_forecast(days=days, lookback=lookback, window=window)

@router.post("")
@router.post("/")
def post_forecast(body: ForecastPostRequest):
    d = body.days or body.periods or 30
    lb = body.lookback or 90
    w = body.window or 7
    return forecast_service.get_forecast(days=d, lookback=lb, window=w)
