from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SCartItemAdd(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class SCartItemGet(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True