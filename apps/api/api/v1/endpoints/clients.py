from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import io
import openpyxl

from models.client import Client
from schemas.client import ClientCreate, ClientUpdate, ClientResponse
from core.database import get_db
from core.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ClientResponse])
def read_clients(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    include_deleted: bool = False,
    current_user: str = Depends(get_current_user)
) -> Any:
    query = db.query(Client)
    if not include_deleted:
        query = query.filter(Client.deleted_at.is_(None))
    clients = query.offset(skip).limit(limit).all()
    return clients

@router.post("/upload")
def upload_clients(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> Any:
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an .xlsx file")
        
    try:
        content = file.file.read()
        workbook = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
        sheet = workbook.active
        
        rows = list(sheet.iter_rows(values_only=True))
        if not rows or len(rows) < 2:
            raise HTTPException(status_code=400, detail="El archivo Excel está vacío o no tiene encabezados")
            
        processed_count = 0
        
        for row in rows[1:]: # Skip header
            # Expect: Nombre (0), CUIT (1), Domicilio (2), Condición IVA (3), Localidad (4)
            name = row[0]
            cuit = row[1]
            address = row[2] if len(row) > 2 else None
            iva_type = row[3] if len(row) > 3 else None
            city = row[4] if len(row) > 4 else None
            
            if not name or not cuit:
                continue
                
            cuit_str = str(cuit).strip()
            name_str = str(name).strip()
            
            existing = db.query(Client).filter(Client.cuit == cuit_str).first()
            if existing:
                existing.name = name_str
                existing.address = str(address).strip() if address else None
                existing.iva_type = str(iva_type).strip() if iva_type else None
                existing.city = str(city).strip() if city else None
                existing.deleted_at = None # Restore if it was deleted
            else:
                new_client = Client(
                    name=name_str,
                    cuit=cuit_str,
                    address=str(address).strip() if address else None,
                    iva_type=str(iva_type).strip() if iva_type else None,
                    city=str(city).strip() if city else None
                )
                db.add(new_client)
            processed_count += 1
            
        db.commit()
        return {"message": f"Successfully processed {processed_count} clients", "count": processed_count}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error procesando el archivo: {str(e)}")

@router.post("/", response_model=ClientResponse)
def create_client(
    client_in: ClientCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> Any:
    client = Client(**client_in.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

@router.get("/{client_id}", response_model=ClientResponse)
def read_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> Any:
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.patch("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    client_in: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> Any:
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    update_data = client_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
        
    db.commit()
    db.refresh(client)
    return client

@router.delete("/{client_id}", response_model=ClientResponse)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
) -> Any:
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if client.deleted_at is not None:
        raise HTTPException(status_code=400, detail="Client is already deleted")
        
    client.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(client)
    return client
