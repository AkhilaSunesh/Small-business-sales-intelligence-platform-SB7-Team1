from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from server.services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/recommendations", tags=["Product Recommendations"])

class ProductRecommendationRequest(BaseModel):
    productId: Optional[str] = None
    ProductID: Optional[str] = None

@router.get("")
@router.get("/")
def get_recommendations(productId: Optional[str] = Query(default=None)):
    return recommendation_service.get_recommendations(product_id=productId)

@router.post("/for-product")
def recommend_for_product(body: ProductRecommendationRequest):
    pid = body.productId or body.ProductID
    if not pid:
        raise HTTPException(status_code=400, detail="productId is required")
    return recommendation_service.recommend_for_product(product_id=pid)

@router.get("/product/{product_id}")
def get_single_product_recommendations(product_id: str):
    return recommendation_service.recommend_for_product(product_id=product_id)
