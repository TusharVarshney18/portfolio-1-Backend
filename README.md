# portfolio-admin-backend

Express + Prisma + Neon Postgres API that powers the portfolio admin (leads, assistant conversations, analytics, click tracking, push notifications). Also keeps the original Nodemailer contact-email flow.

## Stack

- **Express 5** (ESM), **Prisma 6** ORM, **Neon Postgres**
- **JWT** auth (bcrypt password), **Nodemailer** (Gmail) email, **Expo** push notifications
- Deployed as a single serverless function on **Vercel**

## Setup

1. Install dependencies (also generates the Prisma client):

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in values:

   ```bash
   cp .env.example .env
   ```

3. Point the database at Neon and create the schema:

   ```bash
   npm run db:push
   ```

4. Seed the admin user (uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`):

   ```bash
   npm run db:seed
   ```

5. Run locally:

   ```bash
   npm run dev
   ```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string (runtime) |
| `DIRECT_URL` | Neon **direct** connection string (migrations) |
| `JWT_SECRET` | Signs admin JWTs |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin credentials |
| `API_KEY` | Optional shared key required on public write endpoints |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `SMTP_EMAIL` / `SMTP_PASSWORD` | Gmail (App Password) for lead emails |
| `EXPO_ACCESS_TOKEN` | Optional Expo push access token |

## API

### Auth (admin)
- `POST /api/auth/login` — `{ email, password }` → `{ token, admin }`
- `GET /api/auth/me` — current admin (Bearer token)

### Leads
- `POST /api/leads` — public, captures a lead + emails + push
- `GET /api/leads` — list (`?search=&status=read|unread&page=&limit=`)
- `GET /api/leads/stats` — totals
- `GET /api/leads/:id` — single lead
- `PATCH /api/leads/:id` — `{ isRead?, note? }`
- `DELETE /api/leads/:id`

### Assistant
- `POST /api/assistant/messages` — public, log a message
- `GET /api/assistant/conversations` — sessions
- `GET /api/assistant/conversations/:sessionId` — transcript

### Analytics
- `POST /api/analytics/events` — public beacon (`{ type, page, referrer, userAgent }`)
- `GET /api/analytics/stats` — totals, daily series, top pages, referrers

### Clicks
- `POST /api/clicks` — public beacon (`{ target, href, page }`)
- `GET /api/clicks/stats` — top targets

### Devices
- `POST /api/devices` — register an Expo push token (Bearer token)
- `DELETE /api/devices/:token`

Public write endpoints (`POST /api/leads`, `/api/assistant/messages`, `/api/analytics/events`, `/api/clicks`) require an `x-api-key` header only when `API_KEY` is set.
