from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from server.services.segmentation_service import segmentation_service

router = APIRouter(prefix="/api/customer-groups", tags=["Customer Segmentation"])

class ClassifyCustomerRequest(BaseModel):
    customerId: Optional[Any] = None
    CustomerID: Optional[Any] = None
    features: Optional[Dict[str, Any]] = None

@router.get("")
@router.get("/")
def get_customer_groups():
    res = segmentation_service.get_summary()
    if not res.get("success"):
        raise HTTPException(status_code=503, detail="Segmentation data not available")
    return res

@router.post("/classify")
def classify_customer(body: ClassifyCustomerRequest):
    cid = body.customerId or body.CustomerID
    res = segmentation_service.classify_customer(customer_id=cid, features=body.features)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message", "Classification error"))
    return res

@router.get("/customer/{customer_id}")
def get_customer_group(customer_id: int):
    res = segmentation_service.classify_customer(customer_id=customer_id)
    if not res.get("success"):
        raise HTTPException(status_code=404, detail="Customer Not Found")
    return res.get("data")
