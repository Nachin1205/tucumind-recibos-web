from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from core.database import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    cuit = Column(String, nullable=False)
    address = Column(String)
    iva_type = Column(String)
    city = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
