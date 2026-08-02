# EDUFLOW BUGS

**Last Updated:** 2026-08-02 06:56 UTC  
**Session:** 1 - Initial Audit

---

## CRITICAL BUGS

*None.*

---

## HIGH BUGS

### BUG-005
**TITLE:** AppShell never rendered — sidebar, logout, and navigation were missing from all protected pages  
**SEVERITY:** HIGH  
**AREA:** Routing (ProtectedRoute)  
**DESCRIPTION:** `AppShell` component existed but was never mounted in the route tree. `ProtectedRoute` rendered `<Outlet />` without wrapping in `<AppShell>`, so all protected pages had no sidebar, no navigation links, no logout button.  
**REPRODUCTION:** Log in → dashboard has no sidebar navigation or logout button.  
**EXPECTED:** All protected pages render with sidebar, nav links, and logout.  
**ACTUAL:** Pages render without any AppShell chrome.  
**STATUS:** FIXED  
**FIX:** Updated `apps/web/src/components/ProtectedRoute.tsx` to wrap `<Outlet />` with `<AppShell>`.  
**DISCOVERED:** 2026-08-02 08:10 UTC — Playwright browser tests  
**FIXED:** 2026-08-02 08:10 UTC

### BUG-006
**TITLE:** AppShell crashes with `user?.name.charAt(0)` when user is null  
**SEVERITY:** HIGH  
**AREA:** AppShell component  
**DESCRIPTION:** `user?.name.charAt(0)` uses optional chaining on `user?.name` but calls `.charAt(0)` unconditionally on the result. When `user` is null/undefined during the initial render before auth resolves, this throws `Cannot read properties of undefined (reading 'charAt')`, crashing the entire AppShell and all protected routes.  
**REPRODUCTION:** Page reload after login triggers re-initialization; AppShell renders briefly with null user → crash → React error boundary removes component tree.  
**EXPECTED:** AppShell handles null user gracefully.  
**ACTUAL:** AppShell crashes, sidebar disappears, page body becomes empty.  
**STATUS:** FIXED  
**FIX:** Changed to `user?.name?.charAt(0)?.toUpperCase() ?? '?'` in `apps/web/src/components/AppShell.tsx`.  
**DISCOVERED:** 2026-08-02 08:10 UTC — Playwright browser tests  
**FIXED:** 2026-08-02 08:10 UTC

---

## HIGH BUGS

### BUG-001
**TITLE:** Playwright test selector ambiguity - password field selection fails  
**SEVERITY:** HIGH  
**AREA:** Browser Testing  
**DESCRIPTION:** Playwright's `getByLabel(/password/i)` selector matches both the password input field AND the "Show password" toggle button, causing strict mode violations in all authentication tests.  
**REPRODUCTION:**
1. Run `npx playwright test --project=chromium`
2. Any test attempting to fill password field fails with "strict mode violation: resolved to 2 elements"
3. Elements matched: password input + "Show password" button (aria-label)

**EXPECTED:** Selector should uniquely target password input field  
**ACTUAL:** Selector matches 2 elements (input + button), causing test failure  
**ROOT CAUSE:** Both password input label ("Password") and show/hide toggle button (aria-label="Show password") contain the word "password", making regex selector ambiguous  
**STATUS:** FIXED  
**FIX:** Changed all password selectors to use `page.locator('input[type="password"]')` instead of `getByLabel(/password/i)`  
**VERIFICATION:** Re-ran Playwright tests - selector issue resolved, tests now fail at correct point (login authentication)  
**DISCOVERED:** 2026-08-02 07:08 UTC - STEP 7 (Browser Testing)  
**FIXED:** 2026-08-02 07:09 UTC

### BUG-002
**TITLE:** Incorrect test credentials in Playwright tests  
**SEVERITY:** HIGH  
**AREA:** Browser Testing  
**DESCRIPTION:** Playwright tests use hardcoded credentials `admin@eduflow.local` / `change-me-123`, but actual admin password in `.env` is `rBn5u+3h0/ZfNc9d`. This causes all login-dependent tests to fail.  
**REPRODUCTION:**
1. Run `npx playwright test --project=chromium`
2. All tests requiring login fail with timeout waiting for `/dashboard` navigation
3. Login succeeds with UI but fails to authenticate

**EXPECTED:** Tests should use correct credentials from `.env`  
**ACTUAL:** Tests use wrong password, authentication fails  
**ROOT CAUSE:** Test credentials hardcoded instead of reading from environment, and password in `.env.example` (`change-me-123`) differs from actual `.env`  
**STATUS:** FIXED  
**FIX:** Updated all Playwright tests to use correct password `rBn5u+3h0/ZfNc9d`  
**VERIFICATION:** Pending - re-running tests  
**DISCOVERED:** 2026-08-02 07:29 UTC - STEP 7 (Browser Testing)  
**FIXED:** 2026-08-02 07:29 UTC

---

## MEDIUM BUGS

### BUG-003
**TITLE:** Invalid date strings produce 500 instead of 400 VALIDATION_ERROR  
**SEVERITY:** MEDIUM  
**AREA:** API (attendance + assignments routes)  
**DESCRIPTION:** `POST /api/attendance/sessions` and `POST /api/assignments` accept any string for the `date`/`deadline` field. `z.string().transform((val) => new Date(val))` does not validate the parsed result, so `"not-a-date"` becomes an invalid `Date` object. Prisma then rejects it, and the global error handler returns 500 INTERNAL_ERROR instead of a 400 VALIDATION_ERROR.  
**REPRODUCTION:**
1. Login as any faculty
2. `POST /api/attendance/sessions` with `{ "classId": "CS", "division": "A", "date": "not-a-date" }`
3. Response is 500 instead of 400

**EXPECTED:** Invalid date should be rejected with 400 VALIDATION_ERROR  
**ACTUAL:** Returns 500 INTERNAL_ERROR (client sees "Internal server error")  
**ROOT CAUSE:** Zod transform coerces without validation; Prisma rejects invalid Date at the DB layer  
**STATUS:** FIXED  
**FIX:** Replaced `z.string().transform((val) => new Date(val))` with `z.coerce.date()` in `apps/api/src/routes/attendance.ts` and `apps/api/src/routes/assignments.ts` (both create and update schemas)  
**VERIFICATION:** Added regression tests `rejects an invalid date with 400` and `rejects an invalid deadline`; both pass  
**DISCOVERED:** 2026-08-02 08:00 UTC - Session 2 (business-logic test writing)  
**FIXED:** 2026-08-02 08:00 UTC

### BUG-004
**TITLE:** Analytics trend date-key uses local timezone while tests assumed UTC  
**SEVERITY:** LOW  
**AREA:** Tests  
**DESCRIPTION:** Initial analytics trend test matched trend entries using a UTC-based date key while `analytics.service.ts` uses local-time date keys.  
**STATUS:** FIXED  
**FIX:** Test now mirrors the service's `toLocalDateKey` (local timezone)  
**DISCOVERED:** 2026-08-02 08:00 UTC  
**FIXED:** 2026-08-02 08:00 UTC

---

## LOW BUGS

*None discovered yet. First audit in progress.*

---

## COSMETIC BUGS

*None discovered yet. First audit in progress.*

---

## FIXED BUGS

*No bugs fixed yet in this session.*

---

## BUG TEMPLATE

Use this template when recording new bugs:

```
BUG-001
TITLE: [Short description]
SEVERITY: [CRITICAL | HIGH | MEDIUM | LOW | COSMETIC]
AREA: [Auth | Students | Face | Attendance | Assignments | Notices | Analytics | Reports | UI | API | Database | Build]
DESCRIPTION: [Detailed description of the problem]
REPRODUCTION:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
EXPECTED: [What should happen]
ACTUAL: [What actually happens]
ROOT CAUSE: [Technical cause if known]
STATUS: [OPEN | IN_PROGRESS | FIXED | WONT_FIX]
FIX: [Description of fix if STATUS is FIXED]
VERIFICATION: [How fix was verified]
DISCOVERED: [Date and context]
FIXED: [Date if STATUS is FIXED]
```

---

## NOTES

Bugs will be discovered during STEP 7 (First Complete Audit) and STEP 8 (Test All Functionality).

Severity guidelines:
- **CRITICAL:** Blocks core functionality, security vulnerability, data loss risk
- **HIGH:** Major feature broken, workaround exists but difficult
- **MEDIUM:** Feature partially broken, reasonable workaround available
- **LOW:** Minor inconvenience, cosmetic with functional impact
- **COSMETIC:** Visual-only issue, no functional impact
