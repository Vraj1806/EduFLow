# EDUFLOW REQUIREMENTS

**Last Updated:** 2026-08-02 06:55 UTC

---

## FUNCTIONAL REQUIREMENTS

### Phase 1 - Faculty Authentication ✅ COMPLETE
- [x] Faculty can register with email, password, name
- [x] Faculty can log in with email and password
- [x] Faculty can log out
- [x] Faculty session persists across page reloads
- [x] Access tokens expire and refresh automatically
- [x] Passwords are hashed with bcrypt
- [x] JWT tokens stored in httpOnly cookies
- [x] Protected routes require authentication
- [x] Admin role can be assigned

### Phase 2 - Student Management ✅ COMPLETE
- [x] Faculty can create student profiles
- [x] Faculty can list all their students
- [x] Faculty can search students by name, ID, roll number, email, class, division
- [x] Faculty can view individual student profile
- [x] Faculty can edit student information
- [x] Faculty can delete student (cascades to face profile)
- [x] Student IDs must be unique
- [x] Student emails must be unique
- [x] Profile photos can be uploaded (base64)

### Phase 2 - Face Registration ✅ COMPLETE (WITH PLACEHOLDER ML)
- [x] Faculty can register a student's face via camera
- [x] Faculty can register a student's face via file upload
- [x] Faculty can preview captured image before registration
- [x] Faculty can retake photo
- [x] System validates one face per image
- [x] System rejects images with multiple faces
- [x] System rejects images with no faces
- [x] Face embeddings are stored server-side only
- [x] Face embeddings are never exposed via API
- [x] Faculty can view face registration status
- [x] Faculty can re-register face (updates embedding)
- [x] Faculty can remove face data (preserves student)
- [x] Face status tracked (NOT_REGISTERED | REGISTERED)
- [x] Images validated (format: PNG/JPG/WebP, size: max 10MB)
- ⚠️ Face detection uses placeholder (returns simulated result)
- ⚠️ Embedding generation uses placeholder (returns random vector)

### Phase 3+ - Classroom Attendance ✅ COMPLETE (WITH PLACEHOLDER ML)
- [x] Faculty can upload classroom photo
- [x] System detects multiple faces in classroom photo
- [x] System recognizes registered students from detected faces
- [x] System shows confidence scores for each recognition
- [x] System identifies unknown faces (not matched to any student)
- [x] Faculty can review recognized students before confirming
- [x] Faculty can select/deselect students to mark present
- [x] Faculty can create attendance session with class, division, date
- [x] System creates attendance records for selected students
- [x] Faculty can view attendance session history
- [x] Faculty can expand session to view individual records
- [x] Faculty can view present/absent counts per session
- [x] Session status tracked (DRAFT → PROCESSING → COMPLETED → FAILED)
- [x] Faculty can manually edit attendance records
- [x] Faculty can view student's attendance history
- [x] System prevents duplicate records (unique constraint on sessionId + studentId)
- ⚠️ Multi-face detection uses placeholder (3-7 random faces)
- ⚠️ Face matching uses placeholder (random similarity scores)

### Phase 3+ - Assignments ✅ COMPLETE
- [x] Faculty can create assignments with title, description, deadline
- [x] Faculty can target assignments to specific class and division
- [x] Faculty can edit assignment details
- [x] Faculty can delete assignments
- [x] Faculty can view all their assignments
- [x] Assignments show deadline with datetime picker
- [x] Assignment list shows upcoming deadlines
- [x] Assignment status badges (upcoming, overdue - UI logic)

### Phase 3+ - Notices ✅ COMPLETE
- [x] Faculty can create notices with title and content
- [x] Faculty can optionally target notices to specific class/division
- [x] Faculty can publish notices (publishedAt timestamp)
- [x] Faculty can edit draft notices
- [x] Faculty can delete notices
- [x] Faculty can view all their notices
- [x] Notice list shows published vs draft status

### Phase 3+ - Notifications ✅ COMPLETE (WITHOUT DELIVERY)
- [x] System can create notifications with type, title, message, recipient
- [x] Notification types: ABSENCE, ASSIGNMENT, NOTICE, GENERAL
- [x] Notification status tracked: PENDING, SENT, FAILED
- [x] Faculty can view pending notifications
- [x] Notification bell UI component displays count
- ⚠️ Email/SMS delivery not implemented (status remains PENDING)

### Phase 3+ - Analytics ✅ COMPLETE
- [x] Dashboard shows attendance overview (student count, session count, present/absent today, attendance %)
- [x] Dashboard shows attendance trend chart (14-day visualization)
- [x] Dashboard shows class-level attendance statistics
- [x] Analytics page shows stat cards (students, sessions, assignments, notices, notifications)
- [x] Faculty can refresh analytics data
- [x] Trend chart shows present vs absent bar chart by date
- [x] Class stats show sessions, present/absent counts, attendance percentage

### Phase 3+ - Reports ✅ COMPLETE (WITHOUT EXPORT)
- [x] Faculty can generate attendance reports by date range
- [x] Faculty can filter reports by class and division
- [x] Reports show summary (total students, sessions, present, absent, excused, percentage)
- [x] Reports show detailed rows (date, student, status, confidence)
- [x] Report export metadata prepared (CSV/PDF formats planned)
- ⚠️ Actual CSV/PDF file generation not implemented

### Phase 3+ - AI Service ✅ COMPLETE (REQUIRES CONFIGURATION)
- [x] System can classify messages into categories (ABSENCE, ASSIGNMENT, QUESTION, etc.)
- [x] AI service supports OpenAI-compatible APIs
- [x] AI configuration via environment variables
- [x] AI status endpoint shows configured state and capabilities
- [x] AI classification returns category, confidence, reasoning
- ⚠️ Requires API key in environment to function

### Phase 3+ - Faculty Settings ✅ COMPLETE
- [x] Faculty can view their profile
- [x] Faculty can update their name and email
- [x] Faculty can change password
- [x] Password change requires current password verification
- [x] Settings page shows profile information

---

## NON-FUNCTIONAL REQUIREMENTS

### Security ✅ IMPLEMENTED
- [x] Passwords hashed with bcrypt (10 rounds)
- [x] JWT tokens in httpOnly cookies (XSS protection)
- [x] SameSite=lax cookies (CSRF mitigation)
- [x] Access tokens expire (60 minutes default)
- [x] Refresh tokens expire (7 days default)
- [x] Refresh token rotation on each use
- [x] Rate limiting on auth endpoints (20 req/15min)
- [x] Input validation with Zod schemas
- [x] SQL injection prevented (Prisma ORM)
- [x] Face embeddings never exposed via API
- [x] Authorization checks on all protected endpoints
- [x] Role-based access control (ADMIN, FACULTY)
- [x] Image size limits enforced (10MB)
- [x] Image format validation (PNG/JPG/WebP)
- [x] Error messages don't leak sensitive information

### Performance
- [ ] **Not yet measured or optimized**
- Expected requirements:
  - Page load < 3 seconds
  - API response < 500ms (excluding ML)
  - Face registration < 5 seconds
  - Classroom recognition < 10 seconds (depends on ML)
  - Support 100 concurrent faculty users
  - Support 10,000 students per faculty
  - Support 1,000 attendance sessions per month

### Scalability
- [ ] **Not yet designed for scale**
- Current limitations:
  - SQLite single-file database
  - No caching layer
  - No load balancing
  - No horizontal scaling
  - Base64 images in database
  - Synchronous ML processing

### Reliability
- [x] Database transactions for data consistency
- [x] Error handling with global error middleware
- [x] Graceful error messages to users
- [ ] No monitoring or alerting
- [ ] No health checks beyond /api/health
- [ ] No automatic retries
- [ ] No circuit breakers
- [ ] No backup/restore procedures

### Usability
- [x] Responsive design (mobile, tablet, desktop)
- [x] Loading states for all async operations
- [x] Error states with clear messages
- [x] Empty states for lists
- [x] Confirmation dialogs for destructive actions
- [x] Form validation with inline errors
- [x] Search functionality
- [x] Status badges for visual clarity
- [x] Intuitive navigation (sidebar)
- [x] Consistent UI design system (Aether theme)
- [ ] Accessibility not fully tested (WCAG compliance unknown)
- [ ] No keyboard navigation testing
- [ ] No screen reader testing

### Browser Compatibility
- [x] Modern browsers (Chrome, Firefox, Safari, Edge)
- [x] ES2020+ JavaScript features
- [x] MediaDevices API for camera (desktop only)
- [ ] Internet Explorer not supported
- [ ] Mobile camera capture disabled (touch device detection)

### Data Management
- [x] Cascade deletion (student → face profile, session → records)
- [x] Unique constraints (studentId, email, sessionId+studentId)
- [x] Timestamps (createdAt, updatedAt)
- [x] Soft delete not implemented (hard delete only)
- [ ] No audit logs
- [ ] No data versioning
- [ ] No backup automation

---

## TECHNICAL REQUIREMENTS

### Development Environment
- [x] Node.js >= 24
- [x] npm >= 11
- [x] TypeScript 5.9
- [ ] Python >= 3.11 (for future ML service)

### Build Requirements
- [x] TypeScript compilation passes
- [x] Vite build succeeds
- [x] Production bundle generated
- [ ] Bundle size not optimized
- [ ] No tree-shaking verification
- [ ] No code splitting

### Testing Requirements
- [x] Auth tests pass (217 lines)
- [ ] Student service tests (NOT IMPLEMENTED)
- [ ] Face service tests (NOT IMPLEMENTED)
- [ ] Attendance service tests (NOT IMPLEMENTED)
- [ ] Assignment service tests (NOT IMPLEMENTED)
- [ ] Notice service tests (NOT IMPLEMENTED)
- [ ] Analytics service tests (NOT IMPLEMENTED)
- [ ] Integration tests (NOT IMPLEMENTED)
- [ ] Browser tests (NOT IMPLEMENTED)
- [ ] Visual regression tests (NOT IMPLEMENTED)
- [ ] Performance tests (NOT IMPLEMENTED)
- [ ] Security tests (NOT IMPLEMENTED)

### Code Quality Requirements
- [x] TypeScript strict mode enabled
- [x] ESM modules throughout
- [x] Consistent file structure
- [x] Type safety across stack (shared types)
- [ ] Linting not configured (ESLint missing)
- [ ] Prettier not configured
- [ ] Git hooks not configured (Husky)
- [ ] No commit message linting

### Documentation Requirements
- [x] README.md with setup instructions
- [x] AGENTS.md for AI agent guidance
- [x] PHASE2_COMPLETE.md (completion report)
- [x] Design.md (design system)
- [ ] API documentation (Swagger/OpenAPI not configured)
- [ ] Component documentation (Storybook not configured)
- [ ] Deployment documentation (missing)
- [ ] Contributing guidelines (missing)
- [ ] Changelog (missing)

---

## DEPLOYMENT REQUIREMENTS (NOT IMPLEMENTED)

### Production Environment
- [ ] PostgreSQL or MySQL database (not SQLite)
- [ ] Object storage for images (S3, Azure Blob)
- [ ] ML service endpoint (Python FastAPI)
- [ ] Redis for caching (optional)
- [ ] Queue system for async ML (Bull, SQS)
- [ ] SMTP server for email notifications
- [ ] SMS provider for text notifications (optional)
- [ ] CDN for frontend assets
- [ ] Load balancer for API
- [ ] HTTPS certificates
- [ ] Domain name and DNS configuration

### Monitoring & Observability
- [ ] Application logs (structured logging)
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Performance monitoring (DataDog, New Relic)
- [ ] Uptime monitoring (Pingdom, UptimeRobot)
- [ ] Database query monitoring
- [ ] API metrics (request count, latency, errors)
- [ ] Frontend metrics (page load, errors)
- [ ] User analytics (optional)

### CI/CD Requirements
- [ ] Automated tests on pull request
- [ ] Automated build on merge
- [ ] Automated deployment to staging
- [ ] Manual approval for production
- [ ] Rollback capability
- [ ] Database migration automation
- [ ] Environment variable management
- [ ] Secret rotation

---

## COMPLIANCE REQUIREMENTS

### Data Privacy
- [ ] GDPR compliance (if EU users)
- [ ] Student data protection policies
- [ ] Face biometric data consent
- [ ] Data retention policies
- [ ] Right to be forgotten (delete student + face data)
- [ ] Data export capability
- [ ] Privacy policy
- [ ] Terms of service

### Educational Standards
- [ ] FERPA compliance (if US educational institution)
- [ ] Attendance record retention requirements
- [ ] Audit trail for attendance modifications
- [ ] Student data access controls
- [ ] Parent/guardian access (not implemented)

### Biometric Data Regulations
- [ ] Consent for face recognition collection
- [ ] Secure storage of biometric data (face embeddings)
- [ ] Data breach notification procedures
- [ ] Biometric data deletion procedures
- [ ] Compliance with local biometric privacy laws (BIPA in Illinois, CCPA in California, etc.)

---

## OUT OF SCOPE (NOT REQUIRED)

### Explicitly Not Included
- ❌ Student-facing mobile app
- ❌ Parent portal
- ❌ Multi-school/multi-tenant support
- ❌ Grade management
- ❌ Timetable/schedule management
- ❌ Fee management
- ❌ Library management
- ❌ Hostel/transport management
- ❌ Exam management
- ❌ Certificate generation
- ❌ Staff attendance (only student attendance)
- ❌ Payroll integration
- ❌ Video streaming/recording
- ❌ Chat/messaging between faculty and students

---

## FUTURE ENHANCEMENTS (POTENTIAL)

### Phase 4+ Ideas
- Multi-language support (i18n)
- Dark/light theme toggle
- Advanced analytics (ML-powered insights)
- Predictive attendance (at-risk student identification)
- Integration with LMS (Canvas, Moodle, Blackboard)
- Calendar integration (Google Calendar, Outlook)
- Automated absence notifications (email/SMS)
- QR code attendance (alternative to face recognition)
- RFID card attendance (alternative to face recognition)
- Geofencing for attendance (ensure students are on campus)
- Attendance appeal workflow (students can dispute absence)
- Parent notifications (SMS/email for absence)
- Attendance reports for administration
- Export to SIS (Student Information System)
- API for third-party integrations
- Webhooks for real-time attendance events

---

## ACCEPTANCE CRITERIA

### Phase 1 Acceptance ✅ PASSED
- [x] Faculty can register and log in
- [x] Sessions persist across reloads
- [x] Tokens refresh automatically
- [x] Protected routes require auth
- [x] Logout works correctly

### Phase 2 Acceptance ✅ PASSED
- [x] All 25 criteria documented in PHASE2_COMPLETE.md verified

### Phase 3+ Acceptance ⚠️ PARTIAL
- [x] Classroom attendance workflow functional
- [x] Assignments, notices, notifications implemented
- [x] Analytics dashboard functional
- [x] Reports generate correctly
- ⚠️ **ML functions are placeholders (cannot verify accuracy)**
- [ ] Real face recognition not tested
- [ ] Production deployment not verified
- [ ] Performance requirements not measured
- [ ] Security audit not performed
- [ ] Browser testing not automated

---

## PRIORITY CLASSIFICATION

### P0 - Critical (Blocks Production)
1. **Replace placeholder ML functions with real face recognition**
2. Comprehensive test coverage (business logic)
3. Security audit and penetration testing
4. Production deployment configuration
5. Database migration from SQLite to PostgreSQL/MySQL

### P1 - High (Important for Production)
1. Email notification delivery (SMTP integration)
2. CSV/PDF report export
3. Object storage for images (replace base64 in DB)
4. Monitoring and alerting
5. Backup and restore procedures
6. Performance testing and optimization
7. Browser automation tests (Playwright)

### P2 - Medium (Quality of Life)
1. Linting and code formatting (ESLint, Prettier)
2. API documentation (Swagger/OpenAPI)
3. Bundle size optimization
4. Lazy loading for routes
5. Accessibility testing (WCAG compliance)
6. Git hooks (Husky, lint-staged)
7. Changelog and versioning

### P3 - Low (Nice to Have)
1. Component documentation (Storybook)
2. Advanced analytics (ML insights)
3. Multi-language support
4. Dark/light theme toggle
5. Parent portal
6. Student mobile app
7. Integration with third-party systems
