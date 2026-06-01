from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=List[schemas.OrderDetail])
def list_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orders = db.query(models.Order).offset(skip).limit(limit).all()
    result = []
    for order in orders:
        items = []
        for item in order.items:
            items.append(schemas.OrderItemDetail(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                product_sku=item.product.sku,
                quantity=item.quantity,
                unit_price=item.unit_price,
            ))
        result.append(schemas.OrderDetail(
            id=order.id,
            customer_id=order.customer_id,
            customer_name=order.customer.name,
            customer_email=order.customer.email,
            status=order.status,
            total_amount=order.total_amount,
            notes=order.notes,
            items=items,
            created_at=order.created_at,
            updated_at=order.updated_at,
        ))
    return result


@router.post("", response_model=schemas.OrderDetail, status_code=status.HTTP_201_CREATED)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if not order_data.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    # Validate stock availability for all items before making any changes
    product_map = {}
    for item in order_data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found")
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                       f"Available: {product.stock_quantity}, Requested: {item.quantity}"
            )
        product_map[item.product_id] = product

    # Create order and deduct stock
    total_amount = 0.0
    db_order = models.Order(
        customer_id=order_data.customer_id,
        notes=order_data.notes,
        total_amount=0.0,
    )
    db.add(db_order)
    db.flush()

    order_items = []
    for item in order_data.items:
        product = product_map[item.product_id]
        product.stock_quantity -= item.quantity
        total_amount += product.price * item.quantity

        db_item = models.OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=product.price,
        )
        db.add(db_item)
        order_items.append((db_item, product))

    db_order.total_amount = total_amount
    db.commit()
    db.refresh(db_order)

    items = []
    for item in db_order.items:
        items.append(schemas.OrderItemDetail(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name,
            product_sku=item.product.sku,
            quantity=item.quantity,
            unit_price=item.unit_price,
        ))

    return schemas.OrderDetail(
        id=db_order.id,
        customer_id=db_order.customer_id,
        customer_name=customer.name,
        customer_email=customer.email,
        status=db_order.status,
        total_amount=db_order.total_amount,
        notes=db_order.notes,
        items=items,
        created_at=db_order.created_at,
        updated_at=db_order.updated_at,
    )


@router.get("/{order_id}", response_model=schemas.OrderDetail)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    items = [
        schemas.OrderItemDetail(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name,
            product_sku=item.product.sku,
            quantity=item.quantity,
            unit_price=item.unit_price,
        )
        for item in order.items
    ]

    return schemas.OrderDetail(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name,
        customer_email=order.customer.email,
        status=order.status,
        total_amount=order.total_amount,
        notes=order.notes,
        items=items,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.patch("/{order_id}", response_model=schemas.OrderDetail)
def update_order(order_id: int, order_update: schemas.OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_data = order_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)

    db.commit()
    db.refresh(order)

    items = [
        schemas.OrderItemDetail(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name,
            product_sku=item.product.sku,
            quantity=item.quantity,
            unit_price=item.unit_price,
        )
        for item in order.items
    ]

    return schemas.OrderDetail(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.name,
        customer_email=order.customer.email,
        status=order.status,
        total_amount=order.total_amount,
        notes=order.notes,
        items=items,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()
