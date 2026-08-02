# EDUFLOW ENGINEERING DECISIONS

**Last Updated:** 2026-08-02 06:56 UTC  
**Session:** 1 - Initial Audit

---

## ARCHITECTURAL DECISIONS

### ADR-001: Monorepo with npm Workspaces
**Date:** Pre-existing  
**Status:** Accepted  
**Context:** Need to share TypeScript types between frontend and backend while keeping clean boundaries.  
**Decision:** Use npm workspaces with `apps/` and `packages/` structure.  
**Consequences:**
- ✅ Type safety across stack
- ✅ Single `package-lock.json`
- ✅ Simplified dependency management
- ❌ Larger node_modules
- ❌ All packages installed even if only working on one app

### ADR-002: SQLite for Development Database
**Date:** Pre-existing  
**Status:** Accepted for development, migration planned for production  
**Context:** Need simple, zero-config database for development.  
**Decision:** Use SQLite with Prisma ORM.  
**Consequences:**
- ✅ Zero setup required
- ✅ File-based, easy backups
- ✅ Fast for development
- ❌ Cannot scale horizontally
- ❌ No concurrent writes
- ⚠️ Must migrate to PostgreSQL/MySQL for production

### ADR-003: httpOnly Cookies for JWT Storage
**Date:** Pre-existing  
**Status:** Accepted  
**Context:** Need secure token storage that prevents XSS attacks.  
**Decision:** Store JWT access and refresh tokens in httpOnly, SameSite=lax cookies.  
**Consequences:**
- ✅ XSS protection (JavaScript cannot access)
- ✅ CSRF mitigation (SameSite attribute)
- ✅ Automatic cookie inclusion on requests
- ❌ Cannot read token in browser (must use /auth/me for user state)
- ❌ Requires same-origin or proxy setup (Vite proxy configured)

### ADR-004: Base64 Image Storage in Database
**Date:** Pre-existing  
**Status:** Accepted as temporary, migration planned  
**Context:** Need simple image storage without external dependencies.  
**Decision:** Store images as base64 strings in SQLite database.  
**Consequences:**
- ✅ No external storage setup required
- ✅ Simple to implement
- ✅ Images included in database backups
- ❌ Inflates database size (33% overhead)
- ❌ Slows database queries
- ❌ Inefficient for large images
- ⚠️ Must migrate to S3/Azure Blob for production

### ADR-005: Placeholder ML Functions with Service Abstraction
**Date:** Pre-existing  
**Status:** Accepted as temporary, real ML integration required  
**Context:** Need to build and test application logic before ML model is ready.  
**Decision:** Create clean service abstraction with placeholder functions that simulate ML responses.  
**Consequences:**
- ✅ Application logic can be developed and tested independently
- ✅ Clear integration points documented with TODO comments
- ✅ UI/UX can be validated with simulated results
- ❌ Cannot be used in production without real ML
- ⚠️ Users must understand results are random/simulated
- ⚠️ P0 priority to replace before production

### ADR-006: TanStack React Query for State Management
**Date:** Pre-existing  
**Status:** Accepted  
**Context:** Need efficient server state management with caching and automatic refetching.  
**Decision:** Use TanStack React Query instead of Redux or plain React state.  
**Consequences:**
- ✅ Automatic caching and background refetching
- ✅ Loading and error states built-in
- ✅ Optimistic updates easy to implement
- ✅ No boilerplate compared to Redux
- ❌ Learning curve for team unfamiliar with React Query
- ❌ Must understand query keys and cache invalidation

---

## TECHNOLOGY DECISIONS

### TD-001: TypeScript Strict Mode
**Date:** Pre-existing  
**Status:** Accepted  
**Decision:** Enable TypeScript strict mode across all packages.  
**Rationale:** Catch more bugs at compile time, better IDE support, safer refactoring.  
**Alternatives Considered:** Relaxed mode (rejected - less type safety)

### TD-002: ESM Modules Throughout
**Date:** Pre-existing  
**Status:** Accepted  
**Decision:** Use ES modules (import/export) instead of CommonJS (require/module.exports).  
**Rationale:** Modern standard, better tree-shaking, cleaner syntax.  
**Alternatives Considered:** CommonJS (rejected - legacy, no tree-shaking)

### TD-003: Vitest Instead of Jest
**Date:** Pre-existing  
**Status:** Accepted  
**Decision:** Use Vitest for unit testing.  
**Rationale:** Native ESM support, faster than Jest, Vite-compatible config.  
**Alternatives Considered:** Jest (rejected - slower, ESM issues)

### TD-004: Tailwind CSS v4
**Date:** Pre-existing  
**Status:** Accepted  
**Decision:** Use Tailwind CSS v4 for styling.  
**Rationale:** Utility-first CSS, fast development, consistent design system.  
**Alternatives Considered:** CSS Modules, Styled Components (rejected - more boilerplate)

### TD-005: Zod for Validation
**Date:** Pre-existing  
**Status:** Accepted  
**Decision:** Use Zod for input validation and schema parsing.  
**Rationale:** TypeScript-first, type inference, composable schemas.  
**Alternatives Considered:** Joi, Yup (rejected - less TypeScript integration)

---

## PENDING DECISIONS

### PD-001: ML Architecture Choice
**Status:** NEEDS DECISION  
**Context:** Must replace placeholder ML functions with real face recognition.  
**Options:**
1. **Python FastAPI Service** (recommended)
   - Pros: Best ML library support (face_recognition, InsightFace), scalable, language-appropriate
   - Cons: Additional service to deploy, network latency, complexity
2. **Node.js face-api.js**
   - Pros: Same language, no network calls, simpler deployment
   - Cons: Less accurate, slower, blocks event loop, limited model choices
3. **Cloud API** (AWS Rekognition, Azure Face API, Google Vision)
   - Pros: No model management, scales automatically, professional support
   - Cons: Ongoing costs, vendor lock-in, data privacy concerns, latency

**Recommendation:** Python FastAPI service for production-grade accuracy and maintainability.

### PD-002: Production Database Choice
**Status:** NEEDS DECISION  
**Context:** SQLite cannot scale to production workloads.  
**Options:**
1. **PostgreSQL** (recommended)
   - Pros: Full-featured, pgvector for face embeddings, JSON support, mature, open-source
   - Cons: Requires hosted instance, more complex setup
2. **MySQL**
   - Pros: Mature, well-supported, widely used
   - Cons: Less advanced features than PostgreSQL, no vector extension
3. **MongoDB**
   - Pros: Flexible schema, good for unstructured data
   - Cons: Overkill for relational data, Prisma support less mature

**Recommendation:** PostgreSQL with pgvector extension for efficient face embedding similarity search.

### PD-003: Object Storage Choice
**Status:** NEEDS DECISION  
**Context:** Base64 image storage in database is inefficient.  
**Options:**
1. **AWS S3**
   - Pros: Industry standard, cheap, highly reliable, CDN integration
   - Cons: AWS vendor lock-in, requires AWS account
2. **Azure Blob Storage**
   - Pros: Similar to S3, good if already using Azure
   - Cons: Azure vendor lock-in
3. **Cloudflare R2**
   - Pros: No egress fees, S3-compatible API, cheaper
   - Cons: Newer service, less mature

**Recommendation:** AWS S3 for reliability and ecosystem maturity.

### PD-004: Monitoring Platform Choice
**Status:** NEEDS DECISION  
**Context:** Need observability for production.  
**Options:**
1. **DataDog**
   - Pros: Comprehensive, great UX, AI-powered alerts
   - Cons: Expensive at scale
2. **New Relic**
   - Pros: Full-stack observability, good APM
   - Cons: Expensive
3. **Prometheus + Grafana (self-hosted)**
   - Pros: Free, open-source, powerful
   - Cons: Requires infrastructure management, steeper learning curve
4. **Sentry (for errors) + Simple Uptime Monitor**
   - Pros: Free tier generous, focused tools
   - Cons: Less comprehensive, multiple tools

**Recommendation:** Start with Sentry + UptimeRobot (free), upgrade to DataDog if budget allows.

### PD-005: Email Service Choice
**Status:** NEEDS DECISION  
**Context:** Need to send absence notifications, assignment reminders.  
**Options:**
1. **SendGrid**
   - Pros: Reliable, free tier (100/day), good API
   - Cons: Can be blocked by spam filters
2. **AWS SES**
   - Pros: Cheap ($0.10/1000 emails), reliable
   - Cons: Requires AWS account, deliverability setup
3. **Mailgun**
   - Pros: Developer-friendly, good free tier
   - Cons: Less reliable deliverability than SES

**Recommendation:** AWS SES for cost-effectiveness and reliability.

---

## REJECTED DECISIONS

### RD-001: Redux for State Management
**Date:** Pre-existing  
**Status:** Rejected  
**Reason:** Too much boilerplate for server state. TanStack React Query is better fit for data fetching and caching.

### RD-002: GraphQL API
**Date:** Pre-existing  
**Status:** Rejected  
**Reason:** Overkill for this use case. RESTful API is simpler and sufficient. No complex relational queries needed from frontend.

### RD-003: Microservices Architecture
**Date:** Pre-existing  
**Status:** Rejected  
**Reason:** Unnecessary complexity for current scale. Monolithic API with separate ML service is sufficient.

### RD-004: NoSQL Database (MongoDB)
**Date:** Pre-existing  
**Status:** Rejected  
**Reason:** Data is highly relational (students, attendance, sessions). SQL database is more appropriate.

---

## DECISION LOG

*Decisions made during this autonomous session will be logged here.*

### DL-001: Create `.agent/` Directory for Project Memory
**Date:** 2026-08-02 06:52 UTC  
**Made By:** Autonomous Agent Session 1  
**Decision:** Create `.agent/` directory with structured memory files for persistent context.  
**Rationale:** Enables autonomous agents to maintain state across sessions, avoid mistakes, and track progress systematically.  
**Alternatives:** Single AGENTS.md file (rejected - too limited for complex autonomous workflows)  
**Status:** Implemented  

### DL-002: Use Playwright for Browser Testing
**Date:** 2026-08-02 06:56 UTC (pending implementation)  
**Made By:** Autonomous Agent Session 1  
**Decision:** Install and configure Playwright for automated browser testing.  
**Rationale:** Industry standard, supports all browsers, powerful selectors, built-in test runner, screenshot/video recording.  
**Alternatives:** Cypress (rejected - slower, no multi-browser support), Selenium (rejected - outdated, flakier)  
**Status:** Approved, pending implementation in STEP 6  

---

## NOTES

- Decisions should be revisited as context changes
- Document why alternatives were rejected
- All decisions should be verifiable (not based on assumptions)
- Decisions should align with project requirements and constraints
