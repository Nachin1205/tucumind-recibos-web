from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ClientBase(BaseModel):
    name: str = Field(..., description="Name of the client")
    cuit: str = Field(..., description="CUIT/CUIL of the client")
    address: Optional[str] = None
    iva_type: Optional[str] = None
    city: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    cuit: Optional[str] = None
    address: Optional[str] = None
    iva_type: Optional[str] = None
    city: Optional[str] = None

class ClientResponse(ClientBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
