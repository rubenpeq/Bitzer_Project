from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import SessionLocal
from db.models import OrderDB
from db.schemas import Order, OrderCreate, OrderUpdate
from typing import List

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/orders", response_model=List[Order], tags=["Orders"], summary="Lists all orders in database.")
def get_orders(db: Session = Depends(get_db)):
    return db.query(OrderDB).all()


@router.get("/orders/{order_number}", response_model=Order, tags=["Orders"], summary="Returns details of given order_number.")
def get_order(order_number: int, db: Session = Depends(get_db)):
    order = db.query(OrderDB).filter(OrderDB.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("/orders", response_model=Order, tags=["Orders"], summary="Adds new order to database.")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # Check if order_number already exists
    existing_order = db.query(OrderDB).filter(OrderDB.order_number == order.order_number).first()
    if existing_order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order with number {order.order_number} already exists."
        )

    new_order = OrderDB(**order.model_dump())
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order


@router.patch(
    "/orders/{order_number}",
    response_model=Order,
    tags=["Orders"],
    summary="Partially update an order by its order_number.",
)
def update_order(order_number: int, order_in: OrderUpdate, db: Session = Depends(get_db)):
    """
    Partially update an order. Fields not provided are left untouched.
    Changing the primary key (order_number) is not allowed here.
    """
    order = db.query(OrderDB).filter(OrderDB.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    data = order_in.model_dump(exclude_unset=True)

    # Prevent changing primary key via this endpoint
    if "order_number" in data and data["order_number"] != order_number:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Changing order_number is not allowed."
        )

    # Basic validation example: if both dates given ensure start <= end
    start_date = data.get("start_date", getattr(order, "start_date", None))
    end_date = data.get("end_date", getattr(order, "end_date", None))
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be after end_date."
        )

    # Apply updates
    for field, value in data.items():
        setattr(order, field, value)

    db.commit()
    db.refresh(order)
    return order


@router.delete(
    "/orders/{order_number}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Orders"],
    summary="Delete an order by its order_number.",
)
def delete_order(order_number: int, db: Session = Depends(get_db)):
    order = db.query(OrderDB).filter(OrderDB.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    db.delete(order)
    db.commit()
    return None
