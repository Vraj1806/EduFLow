# EduFlow Agent Instructions

AI-powered faculty automation platform. Monorepo with React/Vite frontend, Express API, Prisma + SQLite.

## Phase Status

**Phase 1 complete** (Auth). **Phase 2 complete** (Aug 1, 2026): Student CRUD + face registration workflow with placeholder ML functions.  
**Phase 3+ complete** (undocumented until Aug 2, 2026): Attendance, assignments, notices, notifications, analytics, reports, AI classification, faculty settings. See `PHASE3_COMPLETE.md`.  
**Phase 4 next**: Integrate real ML model (Python FastAPI sidecar recommended — see `.agent/ML_RESEARCH.md`).

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

**Face registration workflow (Phase 2):**
- Placeholder functions at `apps/api/src/services/face.service.ts`:
  - `detectFaces()` — returns mock detection result
  - `generateEmbedding()` — returns 128-dim random vector
- These are clearly marked with TODO comments for Phase 3 ML integration.
- Embeddings stored as JSON strings in `FaceProfile.embedding` (never exposed via API).

**Database models (schema.prisma):**
- `User` (faculty/admin with JWT auth)
- `Student` (one-to-one with FaceProfile)
- `FaceProfile` (embedding + modelVersion)
- `AttendanceSession` + `AttendanceRecord` (classroom attendance)
- `Assignment` (deadlines, class targeting)
- `Notice` (publish workflow)
- `Notification` (queue: NOTICE/ASSIGNMENT/ABSENCE/GENERAL)

**Student-FaceProfile relationship:** One-to-one with cascade delete. Deleting student removes face data. Removing face data keeps student.

**AppShell layout:** Protected pages are wrapped in `<AppShell>` via `ProtectedRoute.tsx` (sidebar nav + logout). Keep the `user?.name?.charAt` optional chaining pattern — AppShell renders with a null user during auth init.

## ML Integration Points (Phase 4)

Replace placeholder functions in `apps/api/src/services/face.service.ts` and `classroom.service.ts`:

```typescript
// TODO: Connect to actual face detection model (Python FastAPI recommended)
async function detectFaces(imageBase64: string): Promise<FaceDetectionResult> { ... }

// TODO: Connect to actual face recognition model
async function generateEmbedding(imageBase64: string): Promise<FaceEmbedding> { ... }
```

**Full research + API contract:** `.agent/ML_RESEARCH.md` (recommends Python FastAPI sidecar on :5000 with `/detect`, `/embed`, `/detect-multi`).

Once these return real data, the entire workflow (registration, storage, status tracking, classroom recognition) works automatically.

## Testing

**Vitest** in both apps. Configs at `apps/{api,web}/vitest.config.ts`.

```bash
npm test -w apps/api     # API tests (supertest + real SQLite test.db)
npm run test:coverage -w apps/api  # coverage (v8, thresholds enforced)
npm test -w apps/web     # web tests (React Testing Library + jsdom)
npx playwright test      # browser tests (Chromium, 13 tests)
```

**Playwright:** 13 browser tests across `apps/web/e2e/`. Uses admin credentials `admin@eduflow.local` / `rBn5u+3h0/ZfNc9d` from `.env`. Auto-starts API + web via `webServer`.

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

- Actual ML model (placeholder only — `detectFaces`, `generateEmbedding`, `detectClassroomFaces`, `compareFaceWithStudents`)
- PDF/CSV report export generation (API structure ready, export not implemented)
- SMTP/push notification delivery (queue exists; sender is a future task)

Everything else documented in `PHASE3_COMPLETE.md` is implemented and tested.
