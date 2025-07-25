# app/api/orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import OrderDB
from app.db.schemas import Order
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
