from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SReviewAdd(BaseModel):
    farm_id: Optional[int] = None
    product_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=2000)

class SReviewGet(BaseModel):
    id: int
    user_id: int
    farm_id: Optional[int] = None
    product_id: Optional[int] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True