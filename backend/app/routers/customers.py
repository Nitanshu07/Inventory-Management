from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=List[schemas.Customer])
def list_customers(skip: int = 0, limit: int = 100, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Customer)
    if search:
        query = query.filter(
            models.Customer.name.ilike(f"%{search}%") |
            models.Customer.email.ilike(f"%{search}%")
        )
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=schemas.Customer, status_code=status.HTTP_201_CREATED)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Customer with email '{customer.email}' already exists")

    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.get("/{customer_id}", response_model=schemas.Customer)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=schemas.Customer)
def update_customer(customer_id: int, customer_update: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = customer_update.model_dump(exclude_unset=True)
    if "email" in update_data:
        existing = db.query(models.Customer).filter(
            models.Customer.email == update_data["email"],
            models.Customer.id != customer_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Email '{update_data['email']}' is already in use")

    for field, value in update_data.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Restore stock only for orders still in the warehouse (pending/confirmed).
    # Shipped/delivered items have left already; cancelled were already restored.
    in_warehouse = {models.OrderStatus.pending, models.OrderStatus.confirmed}
    for order in customer.orders:
        if order.status in in_warehouse:
            for item in order.items:
                product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                if product:
                    product.stock_quantity += item.quantity
        db.delete(order)

    db.delete(customer)
    db.commit()
