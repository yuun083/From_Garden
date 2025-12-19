from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class SUserAddRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=40)
    address: Optional[str] = Field(None, max_length=500)

class SUserAdd(BaseModel):
    email: EmailStr
    username: str
    hashed_password: str
    role_id: int = 2

class UserAuth(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: int
    email: EmailStr
    username: str
    role_id: int
    phone: Optional[str] = None
    address: Optional[str] = None
    card: Optional[int] = None
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    card: Optional[int] = None

class UserPartialUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    card: Optional[int] = None

class SUserGet(BaseModel):
    id: int
    email: EmailStr
    username: str
    role_id: int
    phone: Optional[str] = None
    address: Optional[str] = None
    card: Optional[int] = None
    
    class Config:
        from_attributes = True

class SUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    role_id: Optional[int] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)
    card: Optional[int] = None

class UserDeleteResponse(BaseModel):
    status: str
    message: str