# Session Context — 2026-09-19

## What Was Done Today

Implemented Phase 1 of the **Email Settings System** for EduFlow — faculty can now choose to send notifications from the central EduFlow SMTP account. Configured production Gmail SMTP. Fixed student deletion cascade constraint.

### Phase 1: Central Email Preference System

1. **Schema** (`apps/api/prisma/schema.prisma`):
   - Added `EmailPreference` enum (`EDUFLOW`, `GMAIL` reserved for Phase 2)
   - `User.emailPreference @default(EDUFLOW)` — sender selection per faculty
   - `Notification.senderId` → FK to User with `onDelete: SetNull` — tracks which faculty triggered each notification
   - `notifications` relation on User model
   - `AttendanceRecord.student` relation: added `onDelete: Cascade` (fixes student deletion when attendance records exist)

2. **Shared Types** (`packages/shared/src/index.ts`):
   - `EmailPreference` type
   - `AuthUser.emailPreference` field
   - `EmailSenderOption` type
   - `EmailSettings` interface (preference + available senders list)

3. **Backend Services**:
   - `mailer.ts:48`: `sendMail(message, { from? })` — optional per-notification `from` override
   - `notification.service.ts:114`: `resolveSenderFrom()` — Phase 1 returns central `SMTP_FROM`; when sender has `GMAIL` preference, throws `503 EMAIL_ACCOUNT_NOT_LINKED` (never silently falls back)
   - `notification.service.ts:38`: `CreateNotificationInput.senderId` — passed through to Notification row
   - `notification.service.ts:168`: delivery resolves sender per row and passes `{ from }` to mailer
   - `attendance.service.ts:49/177/226`: absence notifications now pass `facultyId` as `senderId`
   - `faculty.service.ts:39-68`: `getEmailSettings()` / `updateEmailSettings()` — returns `{emailPreference, senders}` array; `GMAIL → 501 NOT_IMPLEMENTED`
   - `auth.service.ts:14/17`: `toAuthUser()` includes `emailPreference`

4. **API Routes** (`apps/api/src/routes/faculty.ts`):
   - `GET /api/faculty/email-settings` — own account only, behind `requireAuth`
   - `PUT /api/faculty/email-settings` — validates `emailPreference` enum, rejects `GMAIL` with 501
   - No SMTP secrets ever exposed in responses

5. **Frontend** (`apps/web/src`):
   - `api/faculty.ts:16-24`: `getEmailSettings()` / `updateEmailSettings()`
   - `pages/SettingsPage.tsx:253-297`: Email Notifications card — radio buttons for EDUFLOW (active) / GMAIL (disabled, "Coming soon")
   - Uses existing `StatusBadge`, accessible radio role, disabled state

6. **Tests** (`apps/api/tests/email-settings.test.ts`, 7 new + 2 delivery tests):
   - Default preference is EDUFLOW, senders list correct
   - EDUFLOW update succeeds, no credentials in response
   - GMAIL update → 501
   - Auth required
   - Delivery: EDUFLOW sender → central SMTP `from`
   - Delivery: GMAIL sender → notification stays PENDING (failed once, retried), `lastError` contains "Gmail", `sendMail` never called
   - Updated 3 existing tests (`absence-notifications.test.ts`, `notifications.test.ts`) to assert 2-arg `sendMail(msg, {from})`

### Gmail SMTP Configuration

Configured central EduFlow sender (`vraj.b.maheta.1806@gmail.com`) in `apps/api/.env` (gitignored):

```
NOTIFICATIONS_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=vraj.b.maheta.1806@gmail.com
SMTP_PASS=<GOOGLE_APP_PASSWORD>  # never committed
SMTP_FROM=vraj.b.maheta.1806@gmail.com
```

- Worker now starts on boot (`notificationWorker.ts:45` gate lifted)
- Immediate drain + 30s poll (default `NOTIFICATION_POLL_MS`)
- 5 existing PENDING absence notifications ready to be processed by worker

### Student Deletion Fix

- **Problem:** Deleting a student with attendance records failed with FK constraint violation
- **Fix:** `AttendanceRecord.student` relation now has `onDelete: Cascade` (schema.prisma:144)
- Pushed to dev DB

### Verification

- **Typecheck:** API, web, shared — all clean
- **Lint:** 0 errors
- **Tests:** API 151/151, web 1/1 — all passing
- **Worker:** Starts in local dev (`src/index.ts:37`), correctly disabled in Vercel serverless (`apps/api/api/index.ts`)
- **Gitignore:** `apps/api/.env` confirmed ignored; no app password in tracked files

## Current State

- Local dev server restarted with SMTP config loaded
- Notification worker is now running (was blocked by missing `NOTIFICATIONS_ENABLED`)
- 5 PENDING absence notifications in DB (attempts=0) — will be drained by worker
- Student delete cascade now works
- Phase 1 (EduFlow central email) fully implemented and tested
- Phase 2 (Gmail OAuth) intentionally NOT implemented — `GMAIL` enum exists but always returns 501

## Architecture Notes

- Enqueue path (attendance marking) never depends on SMTP — marking can never fail due to mail config
- Delivery path has two independent gates: worker startup + drain function (both check `NOTIFICATIONS_ENABLED`)
- Sender resolution happens at delivery time (not enqueue) so preference changes affect queued rows
- Gmail fallback explicitly prevented: `GMAIL` sender → loud failure, never silent central fallback
- Central SMTP credentials stay server-side only; faculty never see/provide passwords

## Next Steps (When Resumed)

1. Verify 5 PENDING absence notifications were delivered (check DB for `SENT`/`FAILED` + `lastError`)
2. Test real absence flow: mark student ABSENT → confirm email arrives at student address
3. Phase 2 prep (future session): Gmail OAuth 2.0 token storage + refresh flow
4. Consider: serverless queue draining strategy (cron trigger or separate worker dyno)

## Quick Commands

```bash
cd D:\dev\EDU
npm run dev                          # API :4000, web :5173, ML :5000
npm test -w apps/api                 # 151 tests
npm test -w apps/web                 # 1 test
npx tsc --noEmit -p apps/api         # typecheck API
npx tsc --noEmit -p apps/web         # typecheck web
npx eslint apps packages             # lint all
npx prisma studio                    # inspect DB
```

## Files Modified This Session

- `apps/api/prisma/schema.prisma` — EmailPreference enum, User.emailPreference, Notification.senderId, AttendanceRecord cascade
- `packages/shared/src/index.ts` — EmailPreference, AuthUser.emailPreference, EmailSettings
- `apps/api/src/services/mailer.ts` — optional `from` override
- `apps/api/src/services/notification.service.ts` — senderId plumbing, resolveSenderFrom()
- `apps/api/src/services/attendance.service.ts` — enqueueAbsenceNotification() senderId param
- `apps/api/src/services/faculty.service.ts` — getEmailSettings(), updateEmailSettings()
- `apps/api/src/services/auth.service.ts` — toAuthUser() emailPreference
- `apps/api/src/routes/faculty.ts` — GET/PUT /email-settings
- `apps/web/src/api/faculty.ts` — email settings API calls
- `apps/web/src/pages/SettingsPage.tsx` — Email Notifications card UI
- `apps/api/tests/email-settings.test.ts` — NEW (7 tests)
- `apps/api/tests/absence-notifications.test.ts` — updated sendMail assertions + senderId
- `apps/api/tests/notifications.test.ts` — updated sendMail assertions
- `apps/api/.env` — SMTP config added (gitignored, never committed)
