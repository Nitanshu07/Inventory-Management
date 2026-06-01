from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from . import models, schemas
from .database import engine, get_db
from .routers import products, customers, orders
from .routers import auth as auth_router
from .auth import get_current_user

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management System",
    description="API for managing products, customers, orders, and inventory tracking",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public routes
app.include_router(auth_router.router, prefix="/api")

# Protected routes — require valid JWT
app.include_router(products.router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(customers.router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(orders.router, prefix="/api", dependencies=[Depends(get_current_user)])


@app.get("/")
def root():
    return {"message": "Inventory & Order Management System API", "docs": "/docs"}


@app.get("/api/stats", dependencies=[Depends(get_current_user)])
def get_stats(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    low_stock_products = db.query(models.Product).filter(models.Product.stock_quantity <= 10).count()
    total_revenue = db.query(func.sum(models.Order.total_amount)).scalar() or 0.0

    return schemas.DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock_products=low_stock_products,
        total_revenue=total_revenue,
    )
