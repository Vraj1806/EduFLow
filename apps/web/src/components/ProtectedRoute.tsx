import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.tsx';
import { AppShellExperiment } from './AppShellExperiment.tsx';

export function ProtectedRoute() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--theme-bg)] text-[var(--theme-fg)]">
        <span className="text-sm text-[var(--theme-muted)]">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShellExperiment>
      <Outlet />
    </AppShellExperiment>
  );
}
