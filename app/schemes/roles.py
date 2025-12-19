from pydantic import BaseModel, Field

class SRoleAdd(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)

class SRoleGet(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class SRoleGetWithRels(BaseModel):
    id: int
    name: str
    users: list = []
    
    class Config:
        from_attributes = True