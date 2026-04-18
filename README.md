# Document Management System with Real-Time Features

A full-stack Document Management System (DMS) built with Next.js + Express + TypeScript.

It includes:
- JWT authentication (register/login/refresh/logout)
- Document upload to AWS S3
- Document metadata CRUD
- Redis caching with graceful fallback
- Socket.io real-time events (documents, notifications, presence)
- Responsive dashboard UI with drag-drop upload and live updates

## Tech Stack

- Frontend: Next.js 14, TypeScript, Tailwind CSS, Axios, Socket.io Client, Sonner
- Backend: Express 4, TypeScript, Prisma, PostgreSQL, AWS SDK v3, Multer, Redis (ioredis), Socket.io
- Infra: Docker Compose (backend + postgres + redis)

## Project Structure

- backend: Express API, Prisma schema, Socket.io server, Redis + S3 integration
- frontend: Next.js app router UI, auth pages, dashboard, realtime client

## Prerequisites

- Node.js 18+
- npm
- Docker + Docker Compose (recommended for local backend infra)
- AWS S3 bucket + IAM credentials

## Environment Variables

### Backend (`backend/.env`)

Copy from `backend/.env.example`.

Required keys:
- `NODE_ENV`
- `PORT`
- `DATABASE_URL` (or DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `REDIS_URL` (optional, fallback to DB if omitted/unavailable)
- `S3_REGION`
- `S3_BUCKET`
- `S3_PUBLIC_BASE_URL` (optional)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `ALLOWED_ORIGIN`

For Docker Compose networking, use:
- `REDIS_URL=redis://redis:6379`

### Frontend (`frontend/.env.local`)

Copy from `frontend/.env.local.example`.

Required keys:
- `NEXT_PUBLIC_API_BASE_URL` (example: `http://localhost:4000`)
- `NEXT_PUBLIC_SOCKET_URL` (example: `http://localhost:4000`)

## Local Setup

### Option A: Docker Compose (recommended for backend infra)

```bash
cd backend
docker compose up --build
```

This starts:
- backend on `http://localhost:4000`
- postgres on `localhost:55432`
- redis on `localhost:6379`

After first startup, seed categories:

```bash
cd backend
npm run prisma:seed
```

### Option B: Run services manually

1. Start Postgres and Redis.
2. Backend:

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

3. Frontend:

```bash
cd frontend
npm install
npm run dev
```

App URL: `http://localhost:3000`

## Database Schema

Prisma models:
- `User`
- `Document`
- `Category`
- `Notification`

Migration files are under `backend/prisma/migrations`.

## API Endpoints

All protected endpoints require header:
- `Authorization: Bearer <accessToken>`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Documents

- `POST /api/documents/upload`
  - multipart/form-data
  - field: `file`
  - optional: `name`, `description`, `categoryId`
  - validates supported types and 10MB limit

- `GET /api/documents`
  - query: `page`, `limit`, `search`, `categoryId`

- `GET /api/documents/:id`
- `PUT /api/documents/:id`
  - body: `{ name?, description?, categoryId? }`
  - metadata only, file itself is not replaced

- `DELETE /api/documents/:id`

### Categories

- `GET /api/categories`
- `POST /api/categories` (admin-only)
  - body: `{ name, color }`

### Notifications

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

### Health

- `GET /api/health`

## Redis Caching Strategy

Implemented cache keys:
- Document list cache per-user and query params (TTL: 5 minutes)
- Document item cache (TTL: 10 minutes)
- Categories cache (TTL: 1 hour)
- User session cache (TTL follows refresh token expiry)
- Online users/socket presence tracking

On update/delete/upload:
- User document list caches are invalidated
- Affected document cache is invalidated/refreshed

Graceful fallback:
- If Redis is unavailable, handlers continue with DB/S3 flow

## Socket.io Events

Namespace:
- `/realtime` (JWT auth required)

Server emits:
- `connection:status`
- `system:hello`
- `document:uploaded`
- `document:updated`
- `document:deleted`
- `notification:new`
- `user:online`
- `user:offline`
- `category:updated`

Client listens in dashboard for:
- `connection:status`
- `document:uploaded`
- `document:updated`
- `document:deleted`
- `notification:new`

## AWS S3 Setup

1. Create bucket.
2. Configure CORS to allow frontend origin.
3. Create IAM user/role with permissions:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`
4. Add credentials to backend `.env`.
5. Never commit credentials.

## Frontend Features

- Login/Register pages with validation and loading states
- Protected dashboard with:
  - realtime status indicator
  - notifications bell + unread count
  - drag-and-drop upload area + progress
  - document search/filter/pagination
  - edit metadata modal
  - view/delete actions
  - real-time updates reflected automatically

## Testing Instructions

### Authentication

1. Register at `/register`
2. Login at `/login`
3. Verify redirect to `/dashboard`
4. Verify logout clears session

### File Upload

1. Upload a supported file (`pdf/doc/docx/txt/png/jpg/jpeg`)
2. Verify success toast and document appears in list
3. Verify file accessible from returned S3 URL
4. Try file >10MB and unsupported formats; verify error response

### Document Management

1. Search by name
2. Filter by category
3. Edit metadata and verify persistence
4. Delete and verify removed from UI + backend

### Redis Caching

1. Run with `REDIS_URL` enabled and perform repeated list/read calls
2. Stop Redis and retry requests
3. Verify app still works (database fallback)

### Socket.io Real-time

1. Open two dashboard tabs with same user
2. Upload/update/delete in one tab
3. Verify second tab updates automatically
4. Verify notification toast appears live

## Troubleshooting

- `Unauthorized`: verify token exists in local storage and is fresh
- `S3_UPLOAD_FAILED`: verify bucket name, region, IAM permissions
- Empty realtime events: verify `NEXT_PUBLIC_SOCKET_URL` and backend `ALLOWED_ORIGIN`
- DB errors: ensure migrations are applied and DB is reachable
- Redis warnings: app still works without Redis, but caching/presence degrade

## Security Notes

- Do not commit `.env` files or AWS credentials
- Use long random JWT secrets in production
- Prefer IAM roles or secret managers for deployed environments

## Useful Commands

Backend:

```bash
cd backend
npm run dev
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
```
