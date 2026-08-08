# EDUFLOW PROJECT STATE

**Last Updated:** 2026-08-08 UTC
**Session:** 7/6 — Code Review Fixes (4 issues resolved)

---

## SESSION STATUS

Four code-review issues resolved in priority order.

- ✅ Issue 1 (HIGH): Refresh token revocation — `RefreshToken` model, DB-persisted `jti`, rotation-on-use, logout revocation, expired-row cleanup, 2 new tests (18 auth tests)
- ✅ Issue 2 (HIGH): ML sidecar auth — `ML_SERVICE_SECRET` (required when `ML_ENABLED=true`), FastAPI `require_secret` dependency, Express client sends `X-ML-Service-Secret`, 3 new ML tests (14 total), 1 new API test (136 total)
- ✅ Issue 3 (MEDIUM): Pagination — shared `parsePagination`/`paginationMeta` helper, offset-based (`page`/`pageSize`, default 25, max 100), `{ data, meta }` envelope, Prev/Next UI on Students, Attendance Sessions, Assignments, Notices pages
- ✅ Issue 4 (LOW): Face-matching embedding cache — `embeddingCache.ts` module, `loadCachedEmbeddings` in `compareFaceWithStudents`, eager invalidation on face profile create/update/delete

---

## PROJECT STATUS

| Phase | Status |
|-------|--------|
| Phase 1 — Auth | ✅ COMPLETE |
| Phase 2 — Students + Face | ✅ COMPLETE |
| Phase 3+ — Attendance, Assignments, etc. | ✅ COMPLETE |
| Phase 4 — Real ML | ✅ COMPLETE (sidecar + Express integration) |
| Phase 5 — UI Redesign | ✅ COMPLETE |
| Backlog P0 — SMTP + Report export | ✅ COMPLETE |
| Backlog P1 — Postgres, storage, security | ✅ COMPLETE |
| Code Review — 4 issues | ✅ COMPLETE |

---

## QUALITY GATES (as of 2026-08-08, post-fix)

| Gate | Status | Detail |
|------|--------|--------|
| Typecheck | ✅ | Strict, all workspaces (API + web) |
| Lint | ✅ | ESLint v10, 0 errors (3 pre-existing web hook warnings) |
| API tests | ✅ | 136/136 (incl. token revocation, ML secret, pagination) |
| Web tests | ✅ | 1/1 |
| Browser tests | ✅ | 18/18 |
| Build | ✅ | All workspaces |
| ML service tests | ✅ | 14/14 (incl. 3 auth tests) |
| npm audit | ✅ | 0 vulnerabilities |

---

## DESIGN SYSTEM

Master spec: `.superdesign/design-system.md`. Three themes via `--theme-*` tokens
on `[data-theme]`: Light (#F6F7F8), Dark (#0D1117), Lucid (translucent indigo).
System preference + 300ms transitions + pre-paint script (`apps/web/public/theme-init.js`).

---

## KNOWN ISSUES

- InsightFace logs benign warnings on load (ignored models: landmark/genderage).
  Not errors; detection + recognition work.
- Real ML E2E ran against a throwaway DB (`prisma/e2e.db`, since removed) — do not
  reuse in production.
- `prisma/migrations/0_init/migration.sql` is Postgres-only. Dev/CI use SQLite +
  `prisma db push`; never run `prisma migrate` against SQLite.
- Prisma warns that the `package.json#prisma` seed config is deprecated (Prisma 7
  removes it). Migrating to `prisma.config.ts` is a follow-up.
- Remaining follow-ups: CSP nonce for the theme script in production, SMTP retry
  backoff is fixed-interval (no exponential backoff yet).

---

## ML SERVICE DECISIONS (recorded)

- Architecture: Python FastAPI sidecar on :5000 (per ML_RESEARCH.md recommendation)
- Library: InsightFace (buffalo_l), 512-dim ArcFace embeddings
- Express client: `apps/api/src/services/ml.client.ts` (typed, timeout, 503s)
- Comparison: cosine similarity in Express `compareFaceWithStudents()` (research §3 Option 2)
- Threshold: `ML_CONFIDENCE_THRESHOLD` default 0.5, configurable
- Degradation: ML disabled/unreachable → `503 ML_NOT_CONFIGURED` / `503 ML_UNAVAILABLE` (no fabricated results)
- Auth: `ML_SERVICE_SECRET` (required when `ML_ENABLED=true`), `X-ML-Service-Secret` header on every request except `/health`; 401 on missing/wrong secret
- Health: `GET /api/health` → `{status, database, ml}` (ML `degraded` when unreachable)
- Offline dev/CI: `ML_BACKEND=demo` (deterministic, non-production)
- API tests: `ML_ENABLED=true` + `mockMLService()` stubs `global.fetch` (never the real sidecar)
- Embedding cache: `embeddingCache.ts` module caches parsed vectors per class in-memory; eagerly invalidated on face profile create/update/delete

## PAGINATION (recorded)

- Helper: `apps/api/src/lib/pagination.ts` — `parsePagination(req.query)` + `paginationMeta(page, pageSize, total)`
- Envelope: `{ data: { items }, meta: { page, pageSize, total, totalPages } }`
- Applies to: students, attendance sessions, assignments, notices, notifications list endpoints
- Web UI: Prev/next buttons when totalPages > 1; pages reset to 1 on search

## REFRESH TOKEN REVOCATION (recorded)

- Schema: `RefreshToken` model (jti, userId FK, expiresAt, revokedAt)
- `issueSession` is async — persists a row on register/login
- `refreshSession` rotates: marks old jti revoked, issues new pair
- `logout` revokes the presented refresh token server-side before clearing cookies
- Cleanup: `cleanupExpiredRefreshTokens()` runs in the notification worker tick
- 2 new auth tests: rotation revokes old token, logout invalidates refresh token
