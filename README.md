# Inventory & Order Management System

A full-stack web application for managing products, customers, orders, and inventory tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python · FastAPI · SQLAlchemy |
| Frontend | React 18 · Vite · Tailwind CSS |
| Database | PostgreSQL 16 |
| Containerization | Docker · Docker Compose |

## Features

- **Products** — CRUD with unique SKU enforcement, stock tracking, low-stock alerts
- **Customers** — CRUD with unique email enforcement
- **Orders** — Create orders with automatic stock deduction; blocks orders when stock is insufficient
- **Dashboard** — Live stats: total products, customers, orders, low-stock count, total revenue
- **Business Rules**
  - Unique product SKUs (enforced at DB + API level)
  - Unique customer emails (enforced at DB + API level)
  - Orders validate stock availability for *all* items before committing any changes
  - Stock is atomically reduced when an order is placed
- **Environment variables** for all credentials — no hardcoded secrets

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd inventory-management

# 2. Set up environment
cp .env.example .env
# Edit .env and set a secure POSTGRES_PASSWORD

# 3. Build and start all services
docker compose up --build

# App will be available at:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:8000
#   API Docs  → http://localhost:8000/docs
```

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL to your local PostgreSQL instance

# Run the dev server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000/api

# Run the dev server
npm run dev
# → http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Dashboard statistics |
| GET/POST | `/api/products` | List / create products |
| GET/PUT/DELETE | `/api/products/{id}` | Get / update / delete product |
| GET/POST | `/api/customers` | List / create customers |
| GET/PUT/DELETE | `/api/customers/{id}` | Get / update / delete customer |
| GET/POST | `/api/orders` | List / create orders |
| GET/PATCH/DELETE | `/api/orders/{id}` | Get / update status / delete order |

Interactive API docs available at `http://localhost:8000/docs`

## Project Structure

```
inventory-management/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── database.py      # DB session & engine setup
│   │   ├── config.py        # Environment variable config
│   │   └── routers/
│   │       ├── products.py
│   │       ├── customers.py
│   │       └── orders.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.js    # Axios API client
│   │   ├── components/      # Layout, Modal
│   │   ├── pages/           # Dashboard, Products, Customers, Orders
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## Deployment

### Render (recommended free tier)

1. **Database**: Create a PostgreSQL instance on [Render](https://render.com), copy the connection string
2. **Backend**: New Web Service → connect repo → root dir `backend` → start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT` → set `DATABASE_URL` env var
3. **Frontend**: New Static Site → connect repo → root dir `frontend` → build `npm run build` → publish `dist` → set `VITE_API_URL` to your backend URL

### Railway

```bash
# Install Railway CLI, then:
railway login
railway init
railway up
```
Set `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` as Railway env vars.
