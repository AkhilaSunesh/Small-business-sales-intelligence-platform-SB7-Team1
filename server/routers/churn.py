from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from server.services.churn_service import churn_service

router = APIRouter(prefix="/api/churn", tags=["Churn Prediction"])

class ChurnCheckRequest(BaseModel):
    customerId: Optional[int] = None
    CustomerID: Optional[int] = None

@router.get("")
@router.get("/")
def get_churn():
    res = churn_service.get_summary()
    if not res.get("success"):
        raise HTTPException(status_code=503, detail="No churn data available")
    return res

@router.post("/check")
def check_churn(body: ChurnCheckRequest):
    cid = body.customerId or body.CustomerID
    if cid is None:
        raise HTTPException(status_code=400, detail="customerId is required")
    res = churn_service.check_churn(cid)
    if not res.get("success"):
        raise HTTPException(status_code=404, detail="Customer not found")
    return res

@router.get("/customer/{customer_id}")
def get_customer_churn(customer_id: int):
    record = churn_service.get_by_customer_id(customer_id)
    if not record:
        raise HTTPException(status_code=404, detail="Customer Not Found")
    return record
