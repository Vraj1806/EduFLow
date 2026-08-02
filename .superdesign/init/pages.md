# Key Page Dependency Trees

## `/login` and `/` (Login)
Entry: `src/pages/LoginPage.tsx`

Dependencies:
- `src/auth/AuthContext.tsx`
  - `src/api/auth.ts`
    - `src/api/client.ts`
- `src/App.tsx`
  - React Router DOM routes
- `src/main.tsx`
  - `src/styles.css`
- External background asset: Supabase-hosted cinematic MP4

Visual structure: full viewport video, fixed dark overlay, hidden-on-mobile marketing panel on the left, floating glass credential form on the right, mobile brand mark, email/password inputs, password reveal toggle, remember-me option, inline API error, submit state, and link to registration.

## `/register` (Registration)
Entry: `src/pages/RegisterPage.tsx`

Dependencies:
- `src/auth/AuthContext.tsx`
  - `src/api/auth.ts`
    - `src/api/client.ts`
- `src/App.tsx`
- `src/main.tsx`
  - `src/styles.css`
- External background asset: Supabase-hosted cinematic MP4

Visual structure: same video-backed two-column auth layout as Login, with full name, email, password, confirmation, password reveal controls, client-side matching validation, inline API error, submit state, and link to login.

## `/hero` (Hero)
Entry: `src/pages/HeroPage.tsx`

Dependencies:
- `src/App.tsx`
- `src/main.tsx`
  - `src/styles.css`
- External background asset: Supabase-hosted cinematic MP4

Standalone streaming-style art direction with a video background, mobile navigation, text content, and liquid-glass actions. It is visually distinct from the product dashboard and should not define the public auth experiment.

## `/dashboard` (Dashboard)
Entry: `src/pages/DashboardPage.tsx`

Dependencies:
- `src/components/ProtectedRoute.tsx`
  - `src/auth/AuthContext.tsx`
  - `src/components/AppShell.tsx`
    - `src/components/NotificationBell.tsx`
    - `src/auth/AuthContext.tsx`
- `src/api/analytics.ts`
  - `src/api/client.ts`
- `src/components/ui.tsx`

## `/dashboard/students` (Students)
Entry: `src/pages/StudentsPage.tsx`

Dependencies:
- `src/components/ProtectedRoute.tsx`
  - `src/components/AppShell.tsx`
    - `src/components/NotificationBell.tsx`
- `src/api/students.ts`
  - `src/api/client.ts`

## `/dashboard/students/add` (Add Student)
Entry: `src/pages/AddStudentPage.tsx`

Dependencies:
- `src/components/ProtectedRoute.tsx`
  - `src/components/AppShell.tsx`
- `src/api/students.ts`
  - `src/api/client.ts`
- `src/components/ui.tsx`

## `/dashboard/students/:id` (Student Profile)
Entry: `src/pages/StudentProfilePage.tsx`

Dependencies:
- `src/components/ProtectedRoute.tsx`
  - `src/components/AppShell.tsx`
- `src/api/students.ts`
  - `src/api/client.ts`
- `src/api/face.ts`
  - `src/api/client.ts`
- `src/components/ui.tsx`

## `/dashboard/students/:id/register-face` (Face Registration)
Entry: `src/pages/RegisterFacePage.tsx`

Dependencies:
- `src/components/ProtectedRoute.tsx`
  - `src/components/AppShell.tsx`
- `src/api/students.ts`
  - `src/api/client.ts`
- `src/api/face.ts`
  - `src/api/client.ts`
- `src/components/ui.tsx`

## `/dashboard/attendance` (Attendance)
Entry: `src/pages/AttendancePage.tsx`

Dependencies:
- `src/components/ProtectedRoute.tsx`
  - `src/components/AppShell.tsx`
- `src/api/attendance.ts`
  - `src/api/client.ts`
- `src/components/ui.tsx`
- Page-local `CameraModal`

## `/dashboard/assignments` (Assignments)
Entry: `src/pages/AssignmentsPage.tsx`

Dependencies:
- `src/components/ProtectedRoute.tsx`
  - `src/components/AppShell.tsx`
- `src/api/assignments.ts`
  - `src/api/client.ts`
- `src/components/ui.tsx`

## `/dashboard/notices` (Notices)
Entry: `src/pages/NoticesPage.tsx`

Dependencies:
- `src/components/ProtectedRoute.tsx`
  - `src/components/AppShell.tsx`
- `src/api/notices.ts`
  - `src/api/client.ts`
- `src/components/ui.tsx`

## `/dashboard/analytics` (Analytics)
Entry: `src/pages/AnalyticsPage.tsx`

Dependencies:
- `src/components/ProtectedRoute.tsx`
  - `src/components/AppShell.tsx`
- `src/api/analytics.ts`
  - `src/api/client.ts`
- `src/components/ui.tsx`
- Page-local `TrendChart`

## `/dashboard/reports` (Reports)
Entry: `src/pages/ReportsPage.tsx`

Dependencies:
- `src/components/ProtectedRoute.tsx`
  - `src/components/AppShell.tsx`
- `src/api/reports.ts`
  - `src/api/client.ts`
- `src/components/ui.tsx`

## `/dashboard/settings` (Settings)
Entry: `src/pages/SettingsPage.tsx`

Dependencies:
- `src/components/ProtectedRoute.tsx`
  - `src/components/AppShell.tsx`
- `src/auth/AuthContext.tsx`
  - `src/api/auth.ts`
    - `src/api/client.ts`
- `src/api/faculty.ts`
  - `src/api/client.ts`
- `src/api/ai.ts`
  - `src/api/client.ts`
- `src/components/ui.tsx`
