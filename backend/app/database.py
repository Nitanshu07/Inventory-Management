import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


def get_db_url() -> str:
    # 1. Try explicit DATABASE_URL or DATABASE_PUBLIC_URL
    url = os.environ.get("DATABASE_URL") or os.environ.get("DATABASE_PUBLIC_URL")

    # 2. Fallback: build from individual PG* variables (Railway injects these)
    if not url:
        pghost = os.environ.get("PGHOST")
        pgport = os.environ.get("PGPORT", "5432")
        pguser = os.environ.get("PGUSER") or os.environ.get("POSTGRES_USER", "postgres")
        pgpassword = os.environ.get("PGPASSWORD") or os.environ.get("POSTGRES_PASSWORD", "")
        pgdatabase = os.environ.get("PGDATABASE") or os.environ.get("POSTGRES_DB", "railway")
        if pghost and pgpassword:
            url = f"postgresql://{pguser}:{pgpassword}@{pghost}:{pgport}/{pgdatabase}"

    # 3. Local default
    if not url:
        url = "postgresql://postgres:password@localhost:5432/inventory_db"

    # Fix Railway's postgres:// prefix
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    # Add SSL for Railway public proxy
    if ("railway" in url or "rlwy" in url) and "sslmode" not in url:
        separator = "&" if "?" in url else "?"
        url += f"{separator}sslmode=require"

    return url


DATABASE_URL = get_db_url()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
