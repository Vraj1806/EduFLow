import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.tsx';
import { AppShell } from './AppShell.tsx';

export function ProtectedRoute() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
