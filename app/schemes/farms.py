from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class SFarmAdd(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    address: str = Field(..., min_length=1, max_length=500)
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)

class SFarmGet(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    address: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    rating_avg: float = 0.0
    
    class Config:
        from_attributes = True

class SFarmApplicationResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    address: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str
    
    class Config:
        from_attributes = True