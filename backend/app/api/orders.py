# app/api/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import OrderDB
from db.schemas import Order, OrderCreate
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/orders", response_model=List[Order])
def get_orders(db: Session = Depends(get_db)):
    return db.query(OrderDB).all()

@router.get("/orders/{order_number}", response_model=Order)
def get_order(order_number: int, db: Session = Depends(get_db)):
    order = db.query(OrderDB).filter(OrderDB.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/orders", response_model=Order)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    new_order = OrderDB(**order.dict())
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order