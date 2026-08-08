# EduFlow Agent Instructions

AI-powered faculty automation platform. Monorepo with React/Vite frontend, Express API, Prisma + SQLite.

## Phase Status

**Phase 1 complete** (Auth). **Phase 2 complete** (Aug 1, 2026): Student CRUD + face registration workflow with placeholder ML functions.  
**Phase 3+ complete** (undocumented until Aug 2, 2026): Attendance, assignments, notices, notifications, analytics, reports, AI classification, faculty settings. See `PHASE3_COMPLETE.md`.  
**Phase 4 complete** (Aug 5–8, 2026): Real ML integration. ML sidecar (FastAPI + InsightFace, 512-dim ArcFace) built, tested, and wired into the Express API. See `.agent/ML_RESEARCH.md` for the API contract.  
**P0/P1 backlog complete** (Aug 8, 2026): SMTP notification delivery, PDF/CSV report export, PostgreSQL support + initial migration, profile-photo object storage, security hardening (CSP, rate limits, cookie maxAge). See sections below.

See `PHASE2_COMPLETE.md` and `PHASE3_COMPLETE.md` for completion reports and `README.md` for architecture overview.

## Critical Setup Order

```bash
npm install                           # workspace root first
npm run prisma:generate -w apps/api   # generate Prisma client
npm run prisma:push -w apps/api       # create SQLite database
npm run db:seed -w apps/api           # seed admin user from .env
```

**Required before first run:** Copy `apps/api/.env.example` to `apps/api/.env` and set `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, and admin credentials.

Database lives at `apps/api/prisma/dev.db` (SQLite). Inspect with `npx prisma studio` from `apps/api/`.

## Development Commands

```bash
npm run dev              # starts API (:4000) + web (:5173) concurrently
npm test                 # runs vitest in all workspaces
npm run test:coverage -w apps/api  # API tests with coverage thresholds
npm run typecheck        # type-check all workspaces
npm run lint             # ESLint (flat config, eslint.config.mjs)
npm run format           # Prettier write
npx playwright test      # browser tests (auto-starts API + web)
apps/ml/.venv/Scripts/python.exe -m src.main   # ML sidecar (:5000, optional)
```

**Web proxies `/api` to API** (vite.config.ts) so httpOnly auth cookies work without CORS.

## Workspaces

- `apps/api` — Express + Prisma backend
- `apps/web` — React + Vite + TanStack Query frontend  
- `packages/shared` — **type-only** shared types (no runtime code)

**Import rule:** `packages/shared` must be imported with `import type` only. Never add runtime exports there.

## Key Architecture Facts

**Auth:** JWT access + refresh tokens in httpOnly cookies. Never expose tokens to browser JS.

**API envelope:**
- Success: `{ data: ... }`  
- Error: `{ error: { code, message } }`

**Face recognition workflow (Phase 4):**
- ML sidecar at `apps/ml/` (Python 3.12 FastAPI + InsightFace, `buffalo_l`, 512-dim ArcFace embeddings).
- Express client at `apps/api/src/services/ml.client.ts` (`/detect`, `/embed`, `/detect-multi`, `/health`).
- `apps/api/src/services/face.service.ts` — `detectFaces()` → `/detect`, `generateEmbedding()` → `/embed`.
- `apps/api/src/services/classroom.service.ts` — `detectClassroomFaces()` → `/detect-multi`, `compareFaceWithStudents()` does **cosine similarity** locally against `ML_CONFIDENCE_THRESHOLD` (default `0.5`).
- Embeddings stored as JSON strings in `FaceProfile.embedding` (never exposed via API).
- When `ML_ENABLED=false` (default) every ML call throws `503 ML_NOT_CONFIGURED` — no fabricated results.

**Database models (schema.prisma):**
- `User` (faculty/admin with JWT auth)
- `Student` (one-to-one with FaceProfile)
- `FaceProfile` (embedding + modelVersion)
- `AttendanceSession` + `AttendanceRecord` (classroom attendance)
- `Assignment` (deadlines, class targeting)
- `Notice` (publish workflow)
- `Notification` (queue: NOTICE/ASSIGNMENT/ABSENCE/GENERAL; `attempts` + `lastError` for SMTP retries)

**Student-FaceProfile relationship:** One-to-one with cascade delete. Deleting student removes face data. Removing face data keeps student.

**AppShell layout:** Protected pages are wrapped in `<AppShell>` via `ProtectedRoute.tsx` (sidebar nav + logout). Keep the `user?.name?.charAt` optional chaining pattern — AppShell renders with a null user during auth init.

## ML Service (Phase 4)

**Python FastAPI sidecar** at `apps/ml/` on :5000. Implements `/detect`, `/embed`, `/detect-multi`, `/health` (full contract in `.agent/ML_RESEARCH.md`).

```bash
# Start ML service (real backend, auto-downloads buffalo_l ~275MB on first run)
cd apps/ml && .venv/Scripts/python.exe -m src.main

# Offline dev/CI: use the deterministic demo backend
ML_BACKEND=demo .venv/Scripts/python.exe -m src.main

# ML tests
apps/ml/.venv/Scripts/python.exe -m pytest apps/ml/tests -q
```

**Express integration** (`apps/api/src/`):
- `config.ts`: `ML_ENABLED` (default `false`), `ML_SERVICE_URL` (default `http://localhost:5000`), `ML_CONFIDENCE_THRESHOLD` (default `0.5`).
- `services/ml.client.ts`: typed client; throws `503 ML_NOT_CONFIGURED` when disabled, `503 ML_UNAVAILABLE` when unreachable, `503 ML_SERVICE_UNAVAILABLE` when the backend is down.
- `face.service.ts` / `classroom.service.ts`: real ML calls + cosine similarity (no placeholders left).
- `routes/health.ts`: reports `{status, database, ml}` — ML `degraded` when unreachable.

Once the sidecar runs and `ML_ENABLED=true`, the entire workflow (registration, storage, status tracking, classroom recognition) works with real 512-dim embeddings.

## Testing

**Vitest** in both apps. Configs at `apps/{api,web}/vitest.config.ts`.

```bash
npm test -w apps/api     # API tests (supertest + real SQLite test.db)
npm run test:coverage -w apps/api  # coverage (v8, thresholds enforced)
npm test -w apps/web     # web tests (React Testing Library + jsdom)
apps/ml/.venv/Scripts/python.exe -m pytest apps/ml/tests -q  # ML service tests (11)
npx playwright test      # browser tests (Chromium, 18 tests)
```

**ML in API tests:** `vitest.config.ts` sets `ML_ENABLED=true` / `ML_SERVICE_URL=http://ml.test`. Every ML call is mocked via `mockMLService()` / `unstubMLService()` in `tests/helpers.ts` (stubs `global.fetch`, deterministic 512-dim embeddings). Never hit the real sidecar from unit tests.

**Playwright:** 18 browser tests across `apps/web/e2e/`. Uses admin credentials `admin@eduflow.local` / `rBn5u+3h0/ZfNc9d` from `.env`. Auto-starts API + web via `webServer`.

**CI:** `.github/workflows/ci.yml` runs typecheck, lint, API tests, web tests, build, and Playwright.

## Common Pitfalls

- **`.npmrc` override:** User's global npm config has `omit=dev`. The repo-level `.npmrc` includes `include=dev` to install devDependencies. Do not remove this.
- **Prisma client stale:** After schema changes, always run `npm run prisma:generate -w apps/api` before `npm run dev`.
- **Type imports:** Always use `import type` from `@eduflow/shared`, never plain `import`.
- **Camera permissions:** Face registration page requires HTTPS in production for `getUserMedia()`. Development on localhost works without HTTPS.
- **Database location:** SQLite file is relative to `apps/api/prisma/` per `DATABASE_URL="file:./dev.db"` in `.env`.

## Design System

Theme defined in `Design.md` (Aether — orange accent #FF7A3D, dark background, glass morphism, Chakra Petch + Fira Code fonts, 8px spacing rhythm). WebGL/ThreeJS dot-matrix background planned but not yet implemented.

## What Phase 3+ Does NOT Include

Both previously-missing P0 items are implemented (Aug 8, 2026):

- ~~PDF/CSV report export generation~~ **DONE** — `GET /api/reports/attendance/export?format=csv|pdf` (`services/reportExport.service.ts`, pdfkit). Buttons on `ReportsPage.tsx`.
- ~~SMTP/push notification delivery~~ **DONE** — SMTP mailer + background worker (`services/mailer.ts`, `services/notificationWorker.ts`). Enabled via `NOTIFICATIONS_ENABLED=true`.

## Notification Delivery (SMTP)

- Queue: `Notification` rows start `PENDING`. `deliverPendingNotifications()` (`services/notification.service.ts`) drains them oldest-first.
- Recipient is a User id → resolved to the account email; notifications addressed to an email are sent as-is.
- On success → `SENT` + `sentAt`. On failure → `attempts++`, `lastError` stored, retried until `NOTIFICATION_MAX_ATTEMPTS` (default 3), then `FAILED`. **Never faked as sent.**
- `services/notificationWorker.ts` polls on `NOTIFICATION_POLL_MS` (default 30s), drains once at boot, `timer.unref()` so it never blocks shutdown. Started in `index.ts`.
- Env: `NOTIFICATIONS_ENABLED`, `SMTP_HOST/PORT/SECURE/USER/PASS/FROM`, `NOTIFICATION_POLL_MS`, `NOTIFICATION_MAX_ATTEMPTS`.
- Tests: mailer module is mocked via `vi.mock` in `tests/notifications.test.ts`; the mailer's disabled/unconfigured paths are unit-tested in `tests/mailer.test.ts`.

## Report Export (PDF/CSV)

- `services/reportExport.service.ts`: `attendanceReportToCsv()` (BOM-prefixed UTF-8 + summary block) and `attendanceReportToPdf()` (pdfkit, no browser needed).
- `GET /api/reports/attendance/export?format=csv|pdf` + same filters as the report endpoint. `Content-Disposition: attachment`.
- `ReportsPage.tsx` downloads via a same-origin `<a>` (cookies sent automatically). Web helper: `getReportExportUrl(filters, format)` in `apps/web/src/api/reports.ts`.

## Object Storage (profile photos)

- `services/storage.service.ts` behind `STORAGE_PROVIDER` (`none` | `local` | `s3`, default `none`):
  - `none` — photos stay as inline data URLs (previous behavior).
  - `local` — writes to `STORAGE_DIR` (default `apps/api/uploads`, gitignored), served at `STORAGE_BASE_URL` (default `/uploads`) via `express.static`.
  - `s3` — S3-compatible bucket; requires `S3_*` env and the optional `@aws-sdk/client-s3` dep (loaded lazily; ambient types in `src/types/aws-sdk-s3.d.ts`). Fails with a clear 503 when unconfigured.
- `Student.profilePhoto` stores the returned URL/key; deleting a student removes the stored object (`keyFromUrl` + `deleteStoredImage`). Data URLs are validated (format + 10 MB) before touching disk.

## PostgreSQL

- The Prisma schema is provider-agnostic. Dev/CI keeps SQLite (`DATABASE_URL="file:./dev.db"`, tests `file:./test.db`, schema via `prisma db push`).
- For PostgreSQL: set `DATABASE_URL` to a `postgres://` URL, switch `provider = "sqlite"` → `"postgresql"` in `prisma/schema.prisma`, then `npm run prisma:migrate -w apps/api`. `prisma/migrations/0_init/migration.sql` contains the generated Postgres DDL (enums, indexes, FKs). **Do not run `prisma migrate` against SQLite** — dev uses `prisma db push`.

## Security (audit pass, Aug 8 2026)

- Helmet CSP configured: `script-src 'self'` (theme pre-paint moved to `apps/web/public/theme-init.js`), styles allow Google Fonts + inline, images allow `data:`/`blob:`/`https:` (face photos), `frame-ancestors 'none'`, `object-src 'none'`. `upgrade-insecure-requests` disabled so localhost HTTP works.
- Global API rate limit (500/15min, skipped in tests) + the existing tighter auth limiter (20/15min).
- Cookies now carry `maxAge` matching token TTLs (via `ms`), in addition to `httpOnly`/`sameSite=lax`.
- `npm audit` is clean (fixed `nanoid` 3.3.16 → 3.3.18 in the web build chain).
- Known follow-ups (not blocking): move the pre-paint script inline to a CSP nonce for production, add refresh-token revocation, P1 infra from `.agent/STATE.md`.
