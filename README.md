# EduFlow

AI-powered faculty automation platform. Monorepo with clearly separated frontend, backend, AI/ML, and database responsibilities.

## Status

- **Phase 1 — Foundation & Faculty Authentication:** COMPLETE
- **Phase 2 — Student Management + Face Registration:** COMPLETE (see [PHASE2_COMPLETE.md](PHASE2_COMPLETE.md))
- **Phase 3+ — Attendance, Assignments, Notices, Analytics, Reports, AI:** COMPLETE (see [PHASE3_COMPLETE.md](PHASE3_COMPLETE.md))
- **Phase 4 — Real ML Integration:** COMPLETE (FastAPI + InsightFace sidecar wired into the Express API; see `.agent/ML_RESEARCH.md`)
- **Backlog P0/P1:** COMPLETE — SMTP notification delivery, PDF/CSV report export, PostgreSQL support (initial migration in `apps/api/prisma/migrations`), profile-photo object storage, and a security hardening pass. See `AGENTS.md`.

## Structure

```
apps/
  web/        React + Vite + TypeScript frontend (faculty UI)
  api/        Node.js + Express + TypeScript REST API + Prisma
services/
  vision/     Python FastAPI face-detection/recognition service (planned, Phase 4)
packages/
  shared/     TypeScript types shared between apps (type-only, no runtime code)
prisma/       Prisma schema + migrations live in apps/api/prisma
```

## Prerequisites

- Node.js >= 24
- npm >= 11
- Python >= 3.11 (only needed once the vision service is built)

## Setup

```bash
npm install                      # install all workspaces
npm run prisma:generate -w apps/api
npm run prisma:push -w apps/api  # create the SQLite database
npm run db:seed -w apps/api      # create the admin user from .env
```

Copy `apps/api/.env.example` to `apps/api/.env` first and fill in the secrets.

## Development

```bash
npm run dev       # API on :4000 + web on :5173 (web proxies /api to the API)
```

- API: http://localhost:4000/api/health
- Web: http://localhost:5173

## Testing

```bash
npm test                        # runs API (vitest + supertest) and web (vitest) suites
npm run test:coverage -w apps/api # API tests with coverage (thresholds enforced)
npm run typecheck               # type-check all workspaces
npm run lint                    # ESLint across all workspaces
npx playwright test             # browser tests (API :4000 + web :5173 auto-started)
```

## Environment variables

All secrets live in `apps/api/.env` (gitignored). Never hardcode secrets in source.
See `apps/api/.env.example` for the full list with explanations, including the
optional SMTP (`NOTIFICATIONS_ENABLED`, `SMTP_*`), storage (`STORAGE_PROVIDER`,
`S3_*`), and PostgreSQL (`DATABASE_URL` as a `postgres://` URL) settings.

## Conventions

- Shared types live in `packages/shared` and must be imported with `import type` only.
- API responses use a consistent envelope: `{ "data": ... }` on success, `{ "error": { "code", "message" } }` on failure.
- Auth uses JWT access + refresh tokens in httpOnly cookies; never read tokens in the browser.
