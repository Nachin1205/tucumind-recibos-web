from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import desc, text
from sqlalchemy.exc import IntegrityError, ProgrammingError
from sqlalchemy.orm import Session
from sqlalchemy.orm import selectinload

from core.database import get_db
from core.security import get_current_user
from models.client import Client
from models.receipt import Receipt
from models.receipt_payment import ReceiptPayment
from schemas.receipt import ReceiptCreate, ReceiptResponse

router = APIRouter()
TEMPLATES_DIR = Path(__file__).resolve().parents[3] / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))


def _round_money(value: float) -> float:
    return round(float(value), 2)


def _expected_receipt_total(receipt_in: ReceiptCreate) -> float:
    return _round_money(
        receipt_in.subtotal
        - receipt_in.withholding_iibb
        - receipt_in.withholding_ganancias
        - receipt_in.withholding_suss
        - receipt_in.withholding_tem
    )


def _next_receipt_number(db: Session) -> int:
    try:
        return db.execute(text("SELECT nextval('receipt_number_seq')")).scalar_one()
    except ProgrammingError as exc:
        raise HTTPException(
            status_code=500,
            detail="Receipt number sequence is missing. Run `alembic upgrade head` in production.",
        ) from exc


@router.get("/", response_model=List[ReceiptResponse])
def read_receipts(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: str = Depends(get_current_user)
) -> Any:
    """Read all receipts ordered by status (active first) and date desc."""
    receipts = (
        db.query(Receipt)
        .options(selectinload(Receipt.payments))
        .order_by(Receipt.canceled_at.asc(), desc(Receipt.issue_date))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return receipts


@router.post("/", response_model=ReceiptResponse)
def create_receipt(
    receipt_in: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> Any:
    if not receipt_in.payments:
        raise HTTPException(status_code=400, detail="At least one payment is required")

    expected_total = _expected_receipt_total(receipt_in)
    payments_total = _round_money(sum(payment.amount for payment in receipt_in.payments))
    provided_total = _round_money(receipt_in.total)

    if expected_total < 0:
        raise HTTPException(status_code=400, detail="Receipt total cannot be negative")
    if abs(provided_total - expected_total) > 0.01:
        raise HTTPException(status_code=400, detail="Receipt total does not match subtotal and withholdings")
    if abs(payments_total - expected_total) > 0.01:
        raise HTTPException(status_code=400, detail="Payments total does not match receipt total")

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
            "city": client.city,
        }
    else:
        client_snapshot = {"name": "Consumidor Final"}

    next_number = _next_receipt_number(db)

    receipt_data = receipt_in.model_dump(exclude={"payments"})
    receipt = Receipt(
        **receipt_data,
        client_snapshot=client_snapshot,
        receipt_number=next_number,
    )
    db.add(receipt)
    db.flush()

    for p_in in receipt_in.payments:
        payment = ReceiptPayment(**p_in.model_dump(), receipt_id=receipt.id)
        db.add(payment)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Could not create receipt due to a numbering conflict") from exc

    receipt = (
        db.query(Receipt)
        .options(selectinload(Receipt.payments))
        .filter(Receipt.id == receipt.id)
        .first()
    )
    return receipt


@router.get("/{receipt_id}", response_model=ReceiptResponse)
def read_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> Any:
    receipt = (
        db.query(Receipt)
        .options(selectinload(Receipt.payments))
        .filter(Receipt.id == receipt_id)
        .first()
    )
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
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user),
):
    receipt = (
        db.query(Receipt)
        .options(selectinload(Receipt.payments))
        .filter(Receipt.id == receipt_id)
        .first()
    )
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    return templates.TemplateResponse(
        request=request,
        name="receipt_print.html",
        context={"receipt": receipt, "current_date": datetime.now().strftime('%d/%m/%Y %H:%M')},
    )
