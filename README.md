# Hospital Patient Documentation System (HDMS)

A **mobile-first Progressive Web App** for a small hospital participating in India's **Ayushman Bharat** scheme. Replaces a manual WhatsApp-based photo/document workflow with direct-to-Google-Drive uploads, organized automatically by patient.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + vite-plugin-pwa |
| Backend | FastAPI (Python 3.11+) + SQLAlchemy async |
| Database | PostgreSQL 15 |
| External | Google Drive API v3 |
| Infra | Docker Compose |

## Prerequisites

- Docker & Docker Compose
- Google Cloud OAuth 2.0 credentials (for Drive integration)

## Quick Start

```bash
cd hdms

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Paste the output as FERNET_KEY in backend/.env
# Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before using Drive connect.

docker-compose up --build

# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
# API docs: http://localhost:8000/docs
```

If port `8000` is already taken locally, use a temporary override:

```bash
docker compose -f docker-compose.yml -f - up -d <<'YAML'
services:
  backend:
    ports: !override
      - "8001:8000"
  frontend:
    environment:
      VITE_API_URL: http://localhost:8001/api/v1
YAML
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret for signing JWTs (use a random 64-char string) |
| `JWT_ALGORITHM` | `HS256` (default) |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL (default: 60) |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL (default: 30) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL |
| `FERNET_KEY` | Encryption key for Google refresh tokens |
| `FRONTEND_URL` | Frontend origin for CORS |
| `BACKEND_URL` | Backend URL |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

## Implemented Flows

- Register, login, JWT access token auth, and httpOnly refresh-token cookie.
- Google OAuth connect route using Drive `drive.file` scope plus email identity scopes; refresh tokens are encrypted with Fernet before storage.
- Patient create/search/profile/delete with Google Drive folder creation/deletion.
- Photo and document uploads with server-side type and 25 MB size validation; file bytes are streamed to Google Drive and only metadata is stored in PostgreSQL.
- Mobile-first React PWA with bottom navigation, app shell caching, offline upload warning, install prompt handling, and lazy-loaded routes.

## Google OAuth Setup

Create an OAuth 2.0 Web Client in Google Cloud and add this authorized redirect URI for local development:

```text
http://localhost:8000/api/v1/google/callback
```

Then set:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/google/callback
```

When running the backend on an alternate host port such as `8001`, also update `GOOGLE_REDIRECT_URI` and the authorized redirect URI in Google Cloud to match.

## Auth Token Strategy

The backend returns a short-lived JWT access token to the frontend. The longer-lived refresh token is stored only in an httpOnly cookie scoped to `/api/v1`; the frontend calls `POST /api/v1/refresh` when it receives a 401. The refresh token is not stored in localStorage.

## Production Deployment

This application is built to be deployed seamlessly with **Render** (for the backend/database) and **Netlify** (for the frontend).

### 1. Database (Render - Dockerized)
Instead of a Managed Postgres, we will deploy the official Postgres Docker image.
1. On Render, create a **Private Service**.
2. Choose **Deploy an existing image from a registry** and use `postgres:15-alpine`.
3. Name it `hdms-postgres`.
4. Add Environment Variables: `POSTGRES_USER=hdms_user`, `POSTGRES_PASSWORD=hdms_pass`, `POSTGRES_DB=hdms_db`.
5. Add a Disk named `pgdata` mounted at `/var/lib/postgresql/data`.
6. Your Internal Database URL will be: `postgresql+asyncpg://hdms_user:hdms_pass@hdms-postgres:5432/hdms_db`

### 2. Backend (Render)
1. Create a **Web Service** on Render connected to this repository.
2. **Root Directory:** `backend`
3. **Environment:** `Docker`
6. Add the following environment variables:
   - `DATABASE_URL`: (Internal URL from Step 1)
   - `JWT_SECRET_KEY`: (Secure random string)
   - `FERNET_KEY`: (Generated Fernet key)
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: (From Google Cloud Console)
   - `FRONTEND_URL`: (e.g., `https://your-frontend.netlify.app`)
   - `GOOGLE_REDIRECT_URI`: `https://your-backend.onrender.com/api/v1/google/callback`

> After the backend is live, run `alembic upgrade head` in the Render Shell to create the tables.

### 3. Frontend (Netlify)
1. Import this repository in Netlify.
2. **Base directory:** `frontend`
3. **Build command:** `npm run build`
4. **Publish directory:** `frontend/dist`
5. Add the environment variable:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api/v1`

### 4. Google Cloud Console
Don't forget to update your Google OAuth Web Client with the new production URLs:
- Add your Netlify URL to **Authorized JavaScript origins**.
- Add your Render callback URL to **Authorized redirect URIs**.

## Project Structure

```
hdms/
  backend/         # FastAPI application
    app/
      main.py      # App entry point
      core/        # Config, security, dependencies
      db/          # Database models and session
      schemas/     # Pydantic schemas
      services/    # Business logic (Drive, auth)
      api/v1/      # API route handlers
    alembic/       # Database migrations
  frontend/        # React + Vite PWA
    src/
      pages/       # Route pages
      components/  # Reusable UI components
      context/     # React context providers
      hooks/       # Custom hooks
      api/         # Axios client
  docker-compose.yml
```
