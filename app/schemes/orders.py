from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List

class SOrderItemCreate(BaseModel):
    product_id: int
    quantity: float = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)

class SOrderCreate(BaseModel):
    farm_id: int
    delivery_address: str = Field(..., min_length=1, max_length=500)
    total_amount: float = Field(..., gt=0)
    items: List[dict]

    @validator('items')
    def validate_items(cls, v):
        from .order_items import SOrderItemCreate
        for item in v:
            SOrderItemCreate(**item)
        return v

class SOrderUpdate(BaseModel):
    status: Optional[str] = Field(None, min_length=1, max_length=50)
    delivery_address: Optional[str] = Field(None, min_length=1, max_length=500)
    total_amount: Optional[float] = Field(None, gt=0)
    payment_status: Optional[str] = Field(None, min_length=1, max_length=50)

class SOrderGet(BaseModel):
    id: int
    user_id: int
    farm_id: int
    status: str
    order_date: datetime
    delivery_address: str
    total_amount: float
    payment_status: str
    
    class Config:
        from_attributes = True