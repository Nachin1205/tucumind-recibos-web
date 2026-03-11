from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Enum as SQLEnum
import enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base

class PaymentType(str, enum.Enum):
    CASH = "CASH"
    CHEQUE = "CHEQUE"
    TRANSFER = "TRANSFER"

class ReceiptPayment(Base):
    __tablename__ = "receipt_payments"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(Integer, ForeignKey("receipts.id"), nullable=False)
    type = Column(SQLEnum(PaymentType), nullable=False)
    amount = Column(Float, nullable=False)
    ref_number = Column(String, nullable=True)
    bank = Column(String, nullable=True)
    payment_date = Column(DateTime(timezone=True), default=func.now())

    receipt = relationship("Receipt", back_populates="payments")
