from pydantic import BaseModel
from typing import List

class UserSimple(BaseModel):
    id: int
    username: str
    email: str
    
    class Config:
        from_attributes = True

class SRoleGetWithRels(BaseModel):
    id: int
    name: str
    users: List[UserSimple]
    
    class Config:
        from_attributes = True