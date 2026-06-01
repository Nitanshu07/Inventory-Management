# Inventory & Order Management — Backend API

Production-ready FastAPI backend for a full-stack inventory and order management system. Powers product, customer, and order CRUD with JWT authentication, atomic stock management, and PostgreSQL persistence.

🌐 **Live API:** https://inventory-management-production-8b76.up.railway.app
📚 **API Docs (Swagger):** https://inventory-management-production-8b76.up.railway.app/docs
💻 **Source Code:** https://github.com/Nitanshu07/Inventory-Management
🖥️ **Frontend Demo:** https://inventory-management-nine-rouge.vercel.app

## Quick Start

```bash
docker run -d \
  --name inventory-backend \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname" \
  -e SECRET_KEY="your-jwt-secret-key" \
  nitanshu07/inventory-backend:latest
```

Then open `http://localhost:8000/docs` for the interactive Swagger UI.

## With Docker Compose

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: inventory_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    image: nitanshu07/inventory-backend:latest
    environment:
      DATABASE_URL: postgresql://postgres:secret@db:5432/inventory_db
      SECRET_KEY: change-me-in-production
    ports:
      - "8000:8000"
    depends_on:
      - db

volumes:
  postgres_data:
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (`postgresql://user:pass@host:port/db`) |
| `SECRET_KEY` | ✅ | JWT signing secret — use a long random string |
| `PORT` | ❌ | Server port (defaults to `8000`) |

The image also auto-detects Railway's `PGHOST` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` / `PGPORT` variables as a fallback.

## API Overview

| Resource | Endpoints |
|----------|-----------|
| **Auth** | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| **Products** | `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}` |
| **Customers** | `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/{id}` |
| **Orders** | `GET/POST /api/orders`, `GET/PATCH/DELETE /api/orders/{id}` |
| **Stats** | `GET /api/stats` |

All product / customer / order routes require a Bearer JWT token in the `Authorization` header. Get one by calling `/api/auth/login` with form-encoded `username` + `password`.

## Business Rules Enforced

- ✅ Product SKUs are unique
- ✅ Customer emails are unique
- ✅ Stock quantities cannot go negative
- ✅ Orders are rejected if any item lacks sufficient stock
- ✅ Order placement atomically deducts stock
- ✅ Order totals are calculated server-side
- ✅ Stock is restored only when cancelling pending/confirmed orders
  (shipped / delivered items have physically left the warehouse)

## Tech Stack

- **Python 3.11** + **FastAPI** (async web framework)
- **SQLAlchemy 2.0** ORM
- **PostgreSQL** (production) / SQLite (dev fallback)
- **JWT** auth via `python-jose` + **bcrypt** password hashing
- **psycopg2** PostgreSQL driver
- **Uvicorn** ASGI server

## Image Details

- Base: `python:3.11-slim`
- Compressed size: ~76 MB
- Auto-built and pushed on every `main` branch push via GitHub Actions
- Tagged with `latest` and the full git SHA

## License

MIT — see [LICENSE](https://github.com/Nitanshu07/Inventory-Management/blob/main/LICENSE) in the repository.
