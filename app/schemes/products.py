from pydantic import BaseModel, Field
from typing import Optional

class SProductAdd(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category_id: Optional[int] = None
    farm_id: Optional[int] = None
    unit: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    quantity: float = Field(..., ge=0)

class SProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category_id: Optional[int] = None
    farm_id: Optional[int] = None
    unit: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[float] = Field(None, ge=0)

class SProductPartialUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    category_id: Optional[int] = None
    farm_id: Optional[int] = None
    unit: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[float] = Field(None, ge=0)

class SProductGet(BaseModel):
    id: int
    name: str
    category_id: Optional[int] = None
    farm_id: Optional[int] = None
    unit: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = None
    price: float
    quantity: float
    
    class Config:
        from_attributes = True