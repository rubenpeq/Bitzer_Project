from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import OperationDB, MachineDB
from db.schemas import Operation, OperationCreate
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get(
    "/orders/{order_number}/operations",
    response_model=List[Operation],
    tags=["Operations"],
    summary="Lists all operations for given order_number.",
)
def get_operations(order_number: int, db: Session = Depends(get_db)):
    return db.query(OperationDB).filter(OperationDB.order_number == order_number).all()

@router.get(
    "/operation/{operation_id}",
    response_model=Operation,
    tags=["Operations"],
    summary="Returns details of a given operation by its ID.",
)
def get_operation(operation_id: int, db: Session = Depends(get_db)):
    operation = db.query(OperationDB).filter(OperationDB.id == operation_id).first()
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    return operation

@router.get(
    "/operations/get_id",
    response_model=int,
    tags=["Operations"],
    summary="Returns the operation ID given an order number and operation code.",
    description="Example Request: ```GET /operations/get_id?order_number=1234&operation_code=56```"
)
def get_operation_id(order_number: int, operation_code: int, db: Session = Depends(get_db)):
    operation = (
        db.query(OperationDB)
        .filter(
            OperationDB.order_number == order_number,
            OperationDB.operation_code == operation_code,
        )
        .first()
    )
    if not operation:
        raise HTTPException(status_code=404, detail="Operation not found")
    return operation.id

@router.post(
    "/operations",
    response_model=Operation,
    tags=["Operations"],
    summary="Adds new operation to database"
)
def create_operation(operation: OperationCreate, db: Session = Depends(get_db)):
    # Check if operation already exists for the order
    existing = (
        db.query(OperationDB)
        .filter(
            OperationDB.order_number == operation.order_number,
            OperationDB.operation_code == operation.operation_code,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Operation code already exists for this order"
        )

    # Check if machine location exists in Machines table
    machine_exists = (
        db.query(MachineDB)
        .filter(MachineDB.machine_location == operation.machine_location)
        .first()
    )
    if not machine_exists:
        raise HTTPException(
            status_code=400,
            detail=f"Cen. Trabalho '{operation.machine_location}' não existe na base de dados."
        )

    # Create the operation
    new_operation = OperationDB(**operation.model_dump())
    db.add(new_operation)
    db.commit()
    db.refresh(new_operation)
    return new_operation
