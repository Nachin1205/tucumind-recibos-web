from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timezone
from typing import List, Any

from models.receipt import Receipt
from models.receipt_payment import ReceiptPayment
from models.client import Client
from schemas.receipt import ReceiptCreate, ReceiptResponse
from core.database import get_db
from core.security import get_current_user

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/", response_model=List[ReceiptResponse])
def read_receipts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: str = Depends(get_current_user)
) -> Any:
    """Read all receipts ordered by status (active first) and date desc."""
    receipts = db.query(Receipt).order_by(
        Receipt.canceled_at.asc(), # nulls (active) comes first
        desc(Receipt.issue_date)
    ).offset(skip).limit(limit).all()
    return receipts

@router.post("/", response_model=ReceiptResponse)
def create_receipt(
    receipt_in: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> Any:
    # Handle client snapshot
    client_snapshot = {}
    if receipt_in.client_id:
        client = db.query(Client).filter(Client.id == receipt_in.client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        client_snapshot = {
            "id": client.id,
            "name": client.name,
            "cuit": client.cuit,
            "address": client.address,
            "iva_type": client.iva_type,
            "city": client.city
        }
    else:
        client_snapshot = {"name": "Consumidor Final"}

    # Calculate sequential receipt number (MVP single tenant approach)
    max_number = db.query(func.max(Receipt.receipt_number)).scalar() or 0
    next_number = max_number + 1

    # Create Receipt
    receipt_data = receipt_in.model_dump(exclude={"payments"})
    receipt = Receipt(
        **receipt_data,
        client_snapshot=client_snapshot,
        receipt_number=next_number
    )
    db.add(receipt)
    db.flush() # flush to get receipt.id needed for payments

    # Create Payments
    for p_in in receipt_in.payments:
        payment = ReceiptPayment(**p_in.model_dump(), receipt_id=receipt.id)
        db.add(payment)

    db.commit()
    db.refresh(receipt)
    return receipt

@router.get("/{receipt_id}", response_model=ReceiptResponse)
def read_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> Any:
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt

@router.post("/{receipt_id}/cancel", response_model=ReceiptResponse)
def cancel_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> Any:
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    if receipt.canceled_at is not None:
        raise HTTPException(status_code=400, detail="Receipt is already canceled")
        
    receipt.canceled_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(receipt)
    return receipt

@router.get("/{receipt_id}/print", response_class=HTMLResponse)
def print_receipt(
    request: Request,
    receipt_id: int,
    db: Session = Depends(get_db)
):
    receipt = db.query(Receipt).filter(Receipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    return templates.TemplateResponse(
        request=request, name="receipt_print.html", context={"receipt": receipt, "current_date": datetime.now().strftime('%d/%m/%Y %H:%M')}
    )
