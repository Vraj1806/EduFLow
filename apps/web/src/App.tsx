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
