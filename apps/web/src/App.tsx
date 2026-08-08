import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.tsx';
import { ThemeProvider } from './theme/ThemeContext.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { AnalyticsPage } from './pages/AnalyticsPage.tsx';
import { AssignmentsPage } from './pages/AssignmentsPage.tsx';
import { AttendancePage } from './pages/AttendancePage.tsx';
import { DashboardExperimentPage } from './pages/DashboardExperimentPage.tsx';
import { HeroPage } from './pages/HeroPage.tsx';
import { AuthExperimentLoginPage } from './pages/AuthExperimentLoginPage.tsx';
import { AuthExperimentRegisterPage } from './pages/AuthExperimentRegisterPage.tsx';
import { NoticesPage } from './pages/NoticesPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { HelpPage } from './pages/HelpPage.tsx';
import { StudentsPage } from './pages/StudentsPage.tsx';
import { AddStudentPage } from './pages/AddStudentPage.tsx';
import { StudentProfilePage } from './pages/StudentProfilePage.tsx';
import { RegisterFacePage } from './pages/RegisterFacePage.tsx';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<AuthExperimentLoginPage />} />
          <Route path="/login" element={<AuthExperimentLoginPage />} />
          <Route path="/hero" element={<HeroPage />} />
          <Route path="/register" element={<AuthExperimentRegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardExperimentPage />} />
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
            <Route path="/dashboard/help" element={<HelpPage />} />
          </Route>
          <Route path="/dashboard-experiment" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}
