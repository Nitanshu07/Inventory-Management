# Inventory & Order Management System

A full-stack web application for managing products, customers, orders, and inventory tracking — with user authentication, real-time stock management, dark mode, and more.

[![Docker Image](https://img.shields.io/docker/v/nitanshu07/inventory-backend?label=docker%20image&logo=docker&color=2496ED)](https://hub.docker.com/r/nitanshu07/inventory-backend)
[![Image Size](https://img.shields.io/docker/image-size/nitanshu07/inventory-backend/latest?logo=docker)](https://hub.docker.com/r/nitanshu07/inventory-backend)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🌐 **Live App:** [inventory-management-nine-rouge.vercel.app](https://inventory-management-nine-rouge.vercel.app)
🔌 **API:** [inventory-management-production-8b76.up.railway.app](https://inventory-management-production-8b76.up.railway.app)
📚 **API Docs:** [/docs](https://inventory-management-production-8b76.up.railway.app/docs)
🐳 **Docker Image:** [`nitanshu07/inventory-backend`](https://hub.docker.com/r/nitanshu07/inventory-backend)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python · FastAPI · SQLAlchemy · JWT |
| Frontend | React 18 · Vite · Tailwind CSS · Axios |
| Database | PostgreSQL 16 |
| Auth | JWT tokens · bcrypt password hashing |
| Containerization | Docker · Docker Compose |
| Deployment | Railway (backend + Postgres) · Vercel (frontend) |

## Features

### 🔐 Authentication
- User registration with name, email, password
- Login with email + password → 24-hour JWT token
- Protected routes — all product/customer/order APIs require authentication
- Auto-logout on token expiry

### 📦 Product Management
- Full CRUD with **unique SKU** enforcement
- Stock tracking with low-stock alerts (≤ 10 units)
- Visual stock badges (red = out, orange = low, green = healthy)
- Sortable columns, bulk delete, CSV export
- Prevents deletion if product has active orders

### 👥 Customer Management
- Full CRUD with **unique email** enforcement
- Search by name or email
- Sortable columns, bulk delete, CSV export
- Cascading delete: removes their orders and restores stock for active ones

### 🛒 Order Management
- Place orders with multiple line items
- **Automatic stock deduction** when order is placed
- **Blocks orders** when stock is insufficient
- **Automatic total calculation** (server-side)
- Order status lifecycle: Pending → Confirmed → Shipped → Delivered (or Cancelled)
- Visual status timeline in order details
- Smart stock restoration:
  - Cancel pending/confirmed → stock returns to inventory
  - Cancel shipped/delivered → no restock (items already left warehouse)
- Date range filter (7 / 30 / 90 days / all time)
- Status filter, bulk delete, bulk mark-as-shipped
- Sortable columns, CSV export with item details
- **Printable invoice** — opens in a new window with proper letterhead

### 📊 Dashboard
- Live stats: total products, customers, orders, low-stock count, total revenue
- Recent orders feed
- Low-stock alerts panel

### 🎨 UI / UX
- **Dark / light mode toggle** (persists across sessions)
- Inter font + JetBrains Mono for SKUs
- Tabular numerals so prices align in tables
- Skeleton loaders during data fetches
- Empty states with friendly icons and CTAs
- Toast notifications for every action
- Responsive design

## Critical Business Rules

✅ Product SKU must be unique
✅ Customer email must be unique
✅ Product quantity cannot be negative
✅ Orders cannot be placed if inventory is insufficient
✅ Creating an order automatically reduces stock
✅ Cancelling a pending/confirmed order restores stock
✅ Cancelling a shipped/delivered order does NOT restore stock
✅ Backend automatically calculates order totals
✅ Proper error handling with correct HTTP status codes

## API Endpoints

### Auth (public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token (form-data: username, password) |
| GET | `/api/auth/me` | Current logged-in user |

### Products (protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List products (supports `?search=` and pagination) |
| POST | `/api/products` | Create product |
| GET | `/api/products/{id}` | Get one |
| PUT | `/api/products/{id}` | Update |
| DELETE | `/api/products/{id}` | Delete |

### Customers (protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/{id}` | Get one |
| PUT | `/api/customers/{id}` | Update |
| DELETE | `/api/customers/{id}` | Cascade delete (orders + restore stock) |

### Orders (protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List with full detail (customer, items, totals) |
| POST | `/api/orders` | Place order (auto-deducts stock) |
| GET | `/api/orders/{id}` | Get one |
| PATCH | `/api/orders/{id}` | Update status |
| DELETE | `/api/orders/{id}` | Delete (restores stock if pending/confirmed) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Aggregate counts and revenue |

Interactive Swagger docs at `/docs`.

## Quick Start with Docker

### Option 1: Pull the pre-built image from Docker Hub

```bash
docker run -d \
  --name inventory-backend \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  -e SECRET_KEY="your-secret-key" \
  nitanshu07/inventory-backend:latest
```

The image is auto-built on every push to `main` via GitHub Actions and lives at [`nitanshu07/inventory-backend`](https://hub.docker.com/r/nitanshu07/inventory-backend).

### Option 2: Build and run the whole stack locally

```bash
# 1. Clone
git clone https://github.com/Nitanshu07/Inventory-Management.git
cd Inventory-Management

# 2. Configure
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and SECRET_KEY

# 3. Run
docker compose up --build

# Access:
#   Frontend → http://localhost:3000
#   Backend  → http://localhost:8000
#   API Docs → http://localhost:8000/docs
```

## Local Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your local Postgres URL

uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env           # optional — defaults to /api proxy
npm run dev                    # → http://localhost:3000
```

## Project Structure

```
inventory-management/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── auth.py              # JWT + bcrypt helpers
│   │   ├── config.py            # env-var settings
│   │   ├── database.py          # SQLAlchemy engine
│   │   ├── models.py            # User, Product, Customer, Order, OrderItem
│   │   ├── schemas.py           # Pydantic request/response models
│   │   └── routers/
│   │       ├── auth.py          # register / login / me
│   │       ├── products.py
│   │       ├── customers.py
│   │       └── orders.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── nixpacks.toml            # Railway build config
│   └── railway.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # Axios with JWT interceptor
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx # Light / dark mode
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   └── SortableHeader.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Customers.jsx
│   │   │   └── Orders.jsx
│   │   ├── utils/csv.js         # CSV export with Excel-friendly formatting
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vercel.json              # API proxy + SPA rewrites
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## Environment Variables

### Backend
| Var | Required | Description |
|-----|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (`postgresql://user:pass@host:port/db`) |
| `SECRET_KEY` | ✅ | JWT signing secret — use a long random string in production |
| `DEBUG` | ❌ | Defaults to false |

Railway also auto-injects `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — the backend will use these as a fallback if `DATABASE_URL` is missing.

### Frontend
| Var | Default | Description |
|-----|---------|-------------|
| `VITE_API_URL` | `/api` | Backend API base path. On Vercel, `/api/*` is rewritten to the Railway backend automatically (see `vercel.json`). |

## Deployment

### Backend → Railway

1. Sign up at [railway.app](https://railway.app) with GitHub
2. **New Project → Deploy from GitHub repo** → select this repo → set Root Directory to `backend`
3. **+ New → Database → PostgreSQL** to add a database
4. In the backend service Variables tab:
   - Add `DATABASE_URL` referencing the Postgres service's `DATABASE_PUBLIC_URL`
   - Add `SECRET_KEY` with any long random string
5. Settings → **Networking → Generate Domain** to expose publicly

### Frontend → Vercel

1. Sign up at [vercel.com](https://vercel.com) with GitHub
2. **Add New Project** → import this repo → set Root Directory to `frontend`
3. Framework auto-detects as Vite
4. (Optional) Add `VITE_API_URL` env var — not needed if your `vercel.json` proxies `/api/*` to Railway
5. Deploy

The `vercel.json` rewrites `/api/*` to the Railway backend, eliminating CORS issues entirely.

## Default Credentials

There are no default credentials — create an account via the Register page.

## License

MIT
