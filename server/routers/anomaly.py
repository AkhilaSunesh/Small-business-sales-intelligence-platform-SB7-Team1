from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from server.services.anomaly_service import anomaly_service

router = APIRouter(prefix="/api/anomaly-detection", tags=["Anomaly Detection"])

class AnomalyCheckRequest(BaseModel):
    customerId: Optional[int] = None
    CustomerID: Optional[int] = None
    totalAmount: Optional[float] = None
    TotalAmount: Optional[float] = None

@router.get("")
@router.get("/")
def get_anomalies(limit: int = Query(default=20, ge=1, le=100)):
    return anomaly_service.get_summary(limit=limit)

@router.post("/check")
def check_anomaly(body: AnomalyCheckRequest):
    cid = body.customerId or body.CustomerID
    total = body.totalAmount or body.TotalAmount
    res = anomaly_service.check_anomaly(customer_id=cid, total_amount=total)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message", "Validation error"))
    return res

@router.get("/customer/{customer_id}")
def get_customer_anomaly(customer_id: int):
    record = anomaly_service.get_by_customer_id(customer_id)
    if not record:
        raise HTTPException(status_code=404, detail="Customer Not Found")
    return record
