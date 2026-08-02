# Routes

Router: React Router DOM v7. Full router configuration is `src/App.tsx`; `src/main.tsx` supplies `BrowserRouter`, React Query, and global CSS.

| Path | Entry component | Layout/access |
| --- | --- | --- |
| `/` | `src/pages/LoginPage.tsx` | Public |
| `/login` | `src/pages/LoginPage.tsx` | Public |
| `/register` | `src/pages/RegisterPage.tsx` | Public |
| `/hero` | `src/pages/HeroPage.tsx` | Public standalone visual demo |
| `/dashboard` | `src/pages/DashboardPage.tsx` | `ProtectedRoute` then `AppShell` |
| `/dashboard/students` | `src/pages/StudentsPage.tsx` | `ProtectedRoute` then `AppShell` |
| `/dashboard/students/add` | `src/pages/AddStudentPage.tsx` | `ProtectedRoute` then `AppShell` |
| `/dashboard/students/:id` | `src/pages/StudentProfilePage.tsx` | `ProtectedRoute` then `AppShell` |
| `/dashboard/students/:id/register-face` | `src/pages/RegisterFacePage.tsx` | `ProtectedRoute` then `AppShell` |
| `/dashboard/attendance` | `src/pages/AttendancePage.tsx` | `ProtectedRoute` then `AppShell` |
| `/dashboard/assignments` | `src/pages/AssignmentsPage.tsx` | `ProtectedRoute` then `AppShell` |
| `/dashboard/notices` | `src/pages/NoticesPage.tsx` | `ProtectedRoute` then `AppShell` |
| `/dashboard/analytics` | `src/pages/AnalyticsPage.tsx` | `ProtectedRoute` then `AppShell` |
| `/dashboard/reports` | `src/pages/ReportsPage.tsx` | `ProtectedRoute` then `AppShell` |
| `/dashboard/settings` | `src/pages/SettingsPage.tsx` | `ProtectedRoute` then `AppShell` |
| `*` | `Navigate` to `/` | Public fallback |

## `src/App.tsx`

```tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { AnalyticsPage } from './pages/AnalyticsPage.tsx';
import { AssignmentsPage } from './pages/AssignmentsPage.tsx';
import { AttendancePage } from './pages/AttendancePage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { HeroPage } from './pages/HeroPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { NoticesPage } from './pages/NoticesPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { StudentsPage } from './pages/StudentsPage.tsx';
import { AddStudentPage } from './pages/AddStudentPage.tsx';
import { StudentProfilePage } from './pages/StudentProfilePage.tsx';
import { RegisterFacePage } from './pages/RegisterFacePage.tsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hero" element={<HeroPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/students" element={<StudentsPage />} />
          <Route path="/dashboard/students/add" element={<AddStudentPage />} />
          <Route path="/dashboard/students/:id" element={<StudentProfilePage />} />
          <Route path="/dashboard/students/:id/register-face" element={<RegisterFacePage />} />
          <Route path="/dashboard/attendance" element={<AttendancePage />} />
          <Route path="/dashboard/assignments" element={<AssignmentsPage />} />
          <Route path="/dashboard/notices" element={<NoticesPage />} />
          <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
          <Route path="/dashboard/reports" element={<ReportsPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
```

Public authentication pages use `AuthProvider` directly and are deliberately outside `ProtectedRoute` and `AppShell`.
