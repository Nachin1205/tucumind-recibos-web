from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from models.receipt_payment import PaymentType

class ReceiptPaymentBase(BaseModel):
    type: PaymentType
    amount: float
    ref_number: Optional[str] = None
    bank: Optional[str] = None

class ReceiptPaymentCreate(ReceiptPaymentBase):
    pass

class ReceiptPaymentResponse(ReceiptPaymentBase):
    id: int
    receipt_id: int
    payment_date: datetime

    class Config:
        from_attributes = True

class ReceiptBase(BaseModel):
    client_id: Optional[int] = None
    concept: Optional[str] = None
    subtotal: float = 0.0
    withholding_iibb: float = 0.0
    withholding_ganancias: float = 0.0
    withholding_suss: float = 0.0
    withholding_tem: float = 0.0
    total: float = 0.0

class ReceiptCreate(ReceiptBase):
    payments: List[ReceiptPaymentCreate]

class ReceiptResponse(ReceiptBase):
    id: int
    receipt_number: int
    issue_date: datetime
    client_snapshot: Dict[str, Any]
    canceled_at: Optional[datetime] = None
    created_at: datetime
    payments: List[ReceiptPaymentResponse] = []

    class Config:
        from_attributes = True
