from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(Integer, unique=True, nullable=False)
    issue_date = Column(DateTime(timezone=True), default=func.now())
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    client_snapshot = Column(JSON, nullable=False)
    concept = Column(String)
    
    subtotal = Column(Float, default=0.0)
    withholding_iibb = Column(Float, default=0.0)
    withholding_ganancias = Column(Float, default=0.0)
    withholding_suss = Column(Float, default=0.0)
    withholding_tem = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    
    canceled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    payments = relationship("ReceiptPayment", back_populates="receipt", cascade="all, delete-orphan")
