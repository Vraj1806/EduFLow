# EDUFLOW ARCHITECTURE

**Last Updated:** 2026-08-02 06:52 UTC

---

## SYSTEM OVERVIEW

EduFlow is a **monorepo-based faculty automation platform** with AI-powered face recognition attendance tracking.

**Stack:**
- Frontend: React 19 + Vite 8 + TypeScript + TanStack Query + Tailwind CSS 4
- Backend: Node.js + Express 5 + TypeScript (ESM)
- Database: SQLite + Prisma 6
- Auth: JWT (access + refresh tokens in httpOnly cookies)
- Testing: Vitest + Supertest + Testing Library
- Build: npm workspaces

---

## DIRECTORY STRUCTURE

```
C:\dev\EDU\
├── .agent/                      # Autonomous engineering memory (NEW)
│   ├── STATE.md
│   ├── ARCHITECTURE.md
│   ├── REQUIREMENTS.md
│   ├── TODO.md
│   ├── BUGS.md
│   ├── TEST_RESULTS.md
│   ├── DECISIONS.md
│   ├── QUALITY.md
│   ├── DISCOVERIES.md
│   └── LOOP_CONFIG.md
│
├── apps/
│   ├── api/                     # Express REST API (port 4000)
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point
│   │   │   ├── app.ts           # Express app configuration
│   │   │   ├── config.ts        # Environment validation (Zod)
│   │   │   ├── db.ts            # Prisma client singleton
│   │   │   ├── loadEnv.ts       # dotenv loader
│   │   │   ├── middleware/      # auth.ts, error.ts
│   │   │   ├── routes/          # 12 route modules
│   │   │   ├── services/        # 12 service modules
│   │   │   └── types/           # Express type extensions
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Database schema (9 models)
│   │   │   ├── seed.ts          # Admin user seeding
│   │   │   ├── dev.db           # SQLite database (gitignored)
│   │   │   └── test.db          # Test database (gitignored)
│   │   ├── tests/               # Vitest test files
│   │   │   ├── auth.test.ts     # ✅ Comprehensive auth tests
│   │   │   └── global-setup.ts  # Test DB initialization
│   │   ├── .env                 # Environment variables (gitignored)
│   │   ├── .env.example         # Environment template
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   └── vitest.config.ts
│   │
│   └── web/                     # React frontend (port 5173)
│       ├── src/
│       │   ├── main.tsx         # Entry point
│       │   ├── App.tsx          # Router configuration
│       │   ├── api/             # 10 API client modules
│       │   ├── components/      # 5 components (AppShell, ProtectedRoute, etc.)
│       │   ├── contexts/        # AuthContext.tsx
│       │   ├── pages/           # 14 page components
│       │   └── tests/           # Vitest tests
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts       # Dev server + /api proxy
│       └── vitest.config.ts
│
├── packages/
│   └── shared/                  # Type-only package
│       ├── src/
│       │   └── index.ts         # 50+ TypeScript interfaces
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                 # Root workspace config
├── package-lock.json
├── .npmrc                       # include=dev override
├── .gitignore
├── README.md
├── AGENTS.md                    # Agent instructions
├── PHASE2_COMPLETE.md           # Phase 2 completion report
└── Design.md                    # Aether design system
```

---

## DATA FLOW

### Authentication Flow
```
1. User submits credentials → POST /api/auth/login
2. API validates → bcrypt.compare(password, hash)
3. API generates JWT tokens (access + refresh)
4. API sets httpOnly cookies (SameSite=lax, Secure=production)
5. Frontend receives 200 + user data
6. AuthContext stores user state
7. All requests include cookies automatically
8. Access token expires → 401 → Auto-refresh via /api/auth/refresh
9. Refresh token rotates on each use
```

### API Request Flow
```
Browser → Vite Dev Server (5173) → Proxy /api → Express API (4000)
                                       ↓
                                  requireAuth middleware
                                       ↓
                                  Verify JWT from cookie
                                       ↓
                                  Attach req.user
                                       ↓
                                  Route handler
                                       ↓
                                  Service layer
                                       ↓
                                  Prisma ORM
                                       ↓
                                  SQLite database
```

### Face Registration Flow (with Placeholder ML)
```
1. User captures/uploads image → RegisterFacePage
2. Image converted to base64
3. POST /api/students/:id/face with imageBase64
4. face.service.validateImageForRegistration()
5. face.service.detectFaces() → ⚠️ PLACEHOLDER (returns simulated detection)
6. face.service.generateEmbedding() → ⚠️ PLACEHOLDER (returns random 128-dim vector)
7. Store embedding as JSON string in FaceProfile table
8. Update student.faceStatus = 'REGISTERED'
9. Return success
```

### Classroom Attendance Flow (with Placeholder ML)
```
1. Faculty uploads classroom photo → AttendancePage
2. POST /api/attendance/recognize with imageBase64, classId, division
3. classroom.service.detectClassroomFaces() → ⚠️ PLACEHOLDER (3-7 random faces)
4. For each face: classroom.service.compareFaceWithStudents() → ⚠️ PLACEHOLDER (random similarity)
5. Match faces above threshold (0.6)
6. Return recognized students + unknown faces
7. Faculty reviews, selects students to mark present
8. POST /api/attendance/sessions → Create DRAFT session
9. POST /api/attendance/sessions/:id/process → Add PRESENT records
10. POST /api/attendance/sessions/:id/confirm → Mark session COMPLETED
```

---

## DATABASE SCHEMA

### User (Faculty/Admin)
```prisma
id: String @id
email: String @unique
passwordHash: String (bcrypt)
name: String
role: Role (ADMIN | FACULTY)
createdAt: DateTime
updatedAt: DateTime
students: Student[]  # One-to-many
```

### Student
```prisma
id: String @id
studentId: String @unique
rollNumber: String
name: String
email: String @unique
class: String
division: String
semester: String
department: String
profilePhoto: String? (base64)
faceStatus: FaceStatus (NOT_REGISTERED | REGISTERED)
facultyId: String
createdAt: DateTime
updatedAt: DateTime
faculty: User
faceProfile: FaceProfile?  # One-to-one
attendanceRecords: AttendanceRecord[]  # One-to-many
```

### FaceProfile
```prisma
id: String @id
studentId: String @unique
embedding: String (JSON array of 128 floats)
modelVersion: String (e.g., "placeholder-v1.0")
createdAt: DateTime
updatedAt: DateTime
student: Student  # One-to-one with cascade delete
```

### AttendanceSession
```prisma
id: String @id
facultyId: String
classId: String
division: String
date: DateTime
imageReference: String? (base64 classroom photo)
status: SessionStatus (DRAFT | PROCESSING | COMPLETED | FAILED)
createdAt: DateTime
updatedAt: DateTime
records: AttendanceRecord[]  # One-to-many with cascade delete
```

### AttendanceRecord
```prisma
id: String @id
sessionId: String
studentId: String
status: AttendanceStatus (PRESENT | ABSENT | EXCUSED)
confidence: Float? (ML confidence score)
markedAt: DateTime
session: AttendanceSession
student: Student
@@unique([sessionId, studentId])  # One record per student per session
```

### Assignment, Notice, Notification
(Standard CRUD tables with timestamps and ownership)

---

## CRITICAL INTEGRATION POINTS

### ML Service Integration (PHASE 3 TODO)

**Location:** `apps/api/src/services/face.service.ts` and `classroom.service.ts`

**Replace these placeholder functions:**

```typescript
// face.service.ts
async function detectFaces(imageBase64: string): Promise<FaceDetectionResult>
// TODO: Call Python FastAPI service or face-api.js
// Example: await fetch(`${FACE_SERVICE_URL}/detect`, { method: 'POST', body: JSON.stringify({ image: imageBase64 }) })

async function generateEmbedding(imageBase64: string): Promise<FaceEmbedding>
// TODO: Call embedding service
// Example: await fetch(`${FACE_SERVICE_URL}/embed`, { method: 'POST', body: JSON.stringify({ image: imageBase64 }) })

// classroom.service.ts
async function detectClassroomFaces(imageBase64: string): Promise<DetectedFace[]>
// TODO: Multi-face detection endpoint

async function compareFaceWithStudents(faceEmbedding: number[], ...): Promise<...>
// TODO: Implement cosine similarity or ML-based comparison
// Example: cosineSimilarity(faceEmbedding, storedEmbedding)
```

**Options:**
1. **Python FastAPI Service** (recommended for advanced ML)
   - Deploy separate microservice with face_recognition or InsightFace
   - Call via HTTP from Node.js API
   - Keep ML logic separate from business logic

2. **Node.js face-api.js** (simpler, less accurate)
   - Install @vladmandic/face-api or face-api.js
   - Load models on API startup
   - Run in-process (slower, blocks event loop)

3. **Cloud API** (fastest to implement, ongoing costs)
   - AWS Rekognition, Azure Face API, Google Vision
   - Call via SDK
   - No model management required

**Recommendation:** Python FastAPI service for best accuracy and maintainability.

---

## SECURITY ARCHITECTURE

### Authentication
- **Token Storage:** httpOnly cookies (not accessible via JavaScript)
- **Token Rotation:** Refresh token rotates on every use
- **Password Hashing:** bcrypt with 10 rounds
- **CORS:** Not needed (same-origin via Vite proxy)
- **CSRF:** Mitigated by SameSite=lax cookies

### Authorization
- **Middleware:** `requireAuth()` verifies JWT before route handlers
- **Role Checks:** `requireRole(['ADMIN'])` for admin-only endpoints
- **Ownership:** Services validate facultyId matches authenticated user

### Data Protection
- **Face Embeddings:** Never exposed via API responses (stored server-side only)
- **Sensitive Data:** .env gitignored, no secrets in source code
- **Input Validation:** Zod schemas on all API inputs
- **SQL Injection:** Prevented by Prisma ORM (parameterized queries)
- **Rate Limiting:** express-rate-limit on auth endpoints (20 req/15min)

### Image Handling
- **Size Limit:** 10MB max (validated)
- **Format Validation:** PNG/JPG/JPEG/WebP only (base64 regex check)
- **Storage:** Base64 in SQLite (not ideal for production, consider S3/Azure Blob)

---

## KNOWN ARCHITECTURAL ISSUES

### Issue #1: Base64 Image Storage in Database
**Problem:** Storing large base64 images in SQLite inflates database size and slows queries.  
**Impact:** Medium - Works for small deployments, problematic at scale.  
**Fix:** Migrate to object storage (AWS S3, Azure Blob) and store URLs in DB.

### Issue #2: No Caching Layer
**Problem:** Every request hits Prisma → SQLite, no caching.  
**Impact:** Low - SQLite is fast for read-heavy workloads under 100k records.  
**Fix:** Add Redis for session caching and frequently accessed data.

### Issue #3: No Horizontal Scaling
**Problem:** SQLite is single-file, cannot scale across multiple API instances.  
**Impact:** Low - Not needed until >10k concurrent users.  
**Fix:** Migrate to PostgreSQL or MySQL for production.

### Issue #4: No Queue System for ML Processing
**Problem:** Classroom recognition blocks request until ML completes.  
**Impact:** Medium - Can cause timeouts on large photos or slow ML.  
**Fix:** Implement job queue (Bull, BullMQ) for async ML processing.

### Issue #5: Placeholder ML Throughout
**Problem:** ALL face detection and recognition uses random placeholders.  
**Impact:** CRITICAL - Cannot be used in production.  
**Fix:** Integrate real ML model (Priority 1 for Phase 3).

---

## TESTING ARCHITECTURE

### Current Coverage
- ✅ **Auth:** Comprehensive (registration, login, logout, refresh, validation, errors)
- ❌ **Students:** No tests
- ❌ **Face:** No tests
- ❌ **Attendance:** No tests
- ❌ **Other services:** No tests

### Test Infrastructure
- **Backend:** Vitest + Supertest + separate test.db
- **Frontend:** Vitest + Testing Library + jsdom
- **Execution:** Serial to avoid SQLite lock contention
- **Setup:** global-setup.ts creates test database

### Gaps
- No integration tests (API + frontend together)
- No browser automation (Playwright not configured)
- No visual regression tests
- No performance tests
- No security tests (OWASP, penetration testing)

---

## DEPLOYMENT ARCHITECTURE (NOT IMPLEMENTED)

**TODO:** Production deployment not configured.

**Recommended:**
```
├── Frontend: Vercel, Netlify, or AWS S3 + CloudFront
├── API: AWS ECS/Fargate, Railway, Render, or DigitalOcean App Platform
├── Database: PostgreSQL on AWS RDS, Supabase, or Neon
├── ML Service: AWS Lambda (for inference) or dedicated EC2/ECS instance
├── Object Storage: AWS S3 or Azure Blob Storage
├── Queue: AWS SQS, Redis Bull, or Azure Service Bus
└── Monitoring: DataDog, New Relic, or open-source (Prometheus + Grafana)
```

---

## DESIGN SYSTEM

**Theme:** Aether (documented in Design.md)
- Primary: #FF7A3D (orange)
- Background: #1C0F0A (dark)
- Typography: Chakra Petch (display) + Fira Code (body)
- Layout: 8px base rhythm
- Effects: Glass morphism, gradient borders
- Motion: Moderate (900ms/150ms durations)

**Planned:** WebGL/ThreeJS dot-matrix particle background (not implemented)

---

## PERFORMANCE CHARACTERISTICS

### Database Queries
- **Indexed fields:** class, division, faceStatus, facultyId, date
- **Query patterns:** Mostly read-heavy (student lookup, attendance history)
- **Expected bottleneck:** Face comparison against all registered students (O(n) linear scan)
- **Optimization needed:** Vector similarity search index (pgvector for PostgreSQL, or dedicated vector DB like Pinecone/Weaviate)

### Frontend Performance
- **Bundle size:** Not yet measured
- **Lazy loading:** Not implemented (all pages loaded upfront)
- **Caching:** TanStack Query with default staleTime
- **Image optimization:** None (base64 images loaded fully)

---

## TECHNICAL DEBT

1. **High:** Zero test coverage for business logic (students, attendance, etc.)
2. **High:** Placeholder ML functions produce random results
3. **Medium:** Base64 image storage in database
4. **Medium:** No production deployment configuration
5. **Medium:** No monitoring/logging infrastructure
6. **Low:** No lazy loading for frontend routes
7. **Low:** No bundle size optimization
8. **Low:** Documentation outdated (Phase 3+ features not documented)

---

## EXTENSION POINTS

### Easy to Add
- CSV export for reports (basic string formatting)
- PDF generation (use puppeteer or pdfkit)
- Email notifications (nodemailer + SMTP config)
- More AI providers (OpenAI, Anthropic, local models)

### Moderate Effort
- Real-time notifications (WebSockets or SSE)
- Mobile app (React Native, share API clients)
- Multi-language support (i18n)
- Role-based UI permissions (hide features per role)

### Complex
- Real face recognition (ML model integration)
- Vector similarity search (database migration + new indexes)
- Multi-tenancy (school-level isolation)
- SAML/SSO authentication (enterprise login)
