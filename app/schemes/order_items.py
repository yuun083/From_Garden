from pydantic import BaseModel, Field
from typing import Optional

class SOrderItemCreate(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)

class SOrderItemUpdate(BaseModel):
    quantity: Optional[float] = Field(None, gt=0)
    unit_price: Optional[float] = Field(None, gt=0)

class SOrderItemGet(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: float
    unit_price: float
    
    class Config:
        from_attributes = True