from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class SSubscriptionPlanAdd(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., gt=0)
    delivery_frequency: str = Field(..., min_length=1, max_length=50)

class SSubscriptionPlanGet(BaseModel):
    id: int
    name: str
    price: float
    delivery_frequency: str
    
    class Config:
        from_attributes = True

class SUserSubscriptionGet(BaseModel):
    id: int
    user_id: int
    subscription_plan_id: int
    start_date: date
    next_delivery_date: date
    status: str
    
    class Config:
        from_attributes = True