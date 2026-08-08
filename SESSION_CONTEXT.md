# Session Context — 2026-08-08

## What Was Done Today

Completed a full code review of the EduFlow monorepo (`C:\dev\EDU`) with 4 issues fixed in order:

### Issue 1 (HIGH): Refresh Token Revocation
- **Files changed:** `prisma/schema.prisma`, `src/services/token.service.ts`, `src/services/auth.service.ts`, `src/routes/auth.ts`, `src/services/notificationWorker.ts`, `tests/helpers.ts`, `tests/auth.test.ts`
- `RefreshToken` model added (jti unique, userId FK, expiresAt, revokedAt)
- `issueSession` now async — persists DB row on register/login
- `refreshSession` does rotation-on-use: old jti revoked, new pair issued
- `/logout` revokes the token server-side before clearing cookies
- Cleanup via `cleanupExpiredRefreshTokens()` runs in notification worker tick
- 2 new tests: rotation revokes old token, logout invalidates session

### Issue 2 (HIGH): ML Sidecar Authentication
- **Files changed:** `src/config.ts`, `src/services/ml.client.ts`, `src/.env.example`, `apps/ml/src/app.py`, `apps/ml/tests/conftest.py`, `apps/ml/tests/test_app.ts`, `vitest.config.ts`, `tests/face.test.ts`
- `ML_SERVICE_SECRET` added to zod schema (required when `ML_ENABLED=true`)
- FastAPI `require_secret` dependency on `/detect`, `/embed`, `/detect-multi` (not `/health`)
- Express client sends `X-ML-Service-Secret` header on every ML request
- 3 new ML tests (14 total), 1 new API test (136 total)

### Issue 3 (MEDIUM): Pagination
- **Files changed:** `src/lib/pagination.ts` (new), all route files, all service files, `packages/shared/src/index.ts`, `apps/web/src/api/client.ts`, all web API clients, StudentsPage/AttendancePage/AssignmentsPage/NoticesPage
- Offset-based pagination (`page`/`pageSize`, default 25, max 100)
- `{ data, meta }` envelope with `{ page, pageSize, total, totalPages }`
- Prev/Next UI on 4 pages

### Issue 4 (LOW): Embedding Cache
- **Files changed:** `src/services/embeddingCache.ts` (new), `src/services/classroom.service.ts`, `src/services/face.service.ts`
- In-memory cache keyed by `facultyId:classId:division`
- Eager invalidation on face profile create/update/delete

## Current Test Counts
- API tests: 136/136
- ML tests: 14/14
- Lint: 0 errors (3 pre-existing warnings)
- Typecheck: clean (API + web)

## Dev Server
- Was stopped to regenerate Prisma client — needs restart: `npm run dev` from `C:\dev\EDU`
- API: http://localhost:4000
- Web: http://localhost:5173
- Admin login: `admin@eduflow.local` (password in `apps/api/.env`)

## Known Follow-ups
- CSP nonce for the theme script in production
- SMTP retry backoff (currently fixed-interval)
- Prisma seed config deprecation (migrate to `prisma.config.ts`)

## Commands to Pick Up
```bash
cd C:\dev\EDU
npm run prisma:generate -w @eduflow/api   # if schema changed
npx vitest run -w apps/api                # run API tests
apps/ml/.venv/Scripts/python.exe -m pytest apps/ml/tests -q  # ML tests
npx tsc --noEmit -p apps/api              # typecheck API
npx tsc --noEmit -p apps/web              # typecheck web
npx eslint apps packages                  # lint
```
