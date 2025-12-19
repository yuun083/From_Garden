from pydantic import BaseModel, Field

class SCategoryAdd(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class SCategoryGet(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True