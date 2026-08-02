# Shared Layout Components

## `src/components/AppShell.tsx`

Protected application layout: desktop sidebar, mobile header/menu, user section, logout, and notification access.

```tsx
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardCheck, FileText, Bell, BarChart3, FileBarChart, Settings, LogOut, Sparkles, Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext.tsx';
import { NotificationBell } from './NotificationBell.tsx';

interface AppShellProps { children: ReactNode; }

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/students', label: 'Students', icon: Users },
  { path: '/dashboard/attendance', label: 'Attendance', icon: ClipboardCheck },
  { path: '/dashboard/assignments', label: 'Assignments', icon: FileText },
  { path: '/dashboard/notices', label: 'Notices', icon: Bell },
  { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/dashboard/reports', label: 'Reports', icon: FileBarChart },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f14]">
      <aside className="hidden w-64 border-r border-white/10 bg-[#0b0f14] lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF7A3D]">
                <Sparkles size={18} className="text-[#140A08]" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>EduFlow</span>
            </div>
            <NotificationBell />
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <NavLink key={item.path} to={item.path} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-[#FF7A3D]/10 text-[#FF7A3D]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                  <Icon size={18} />{item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF7A3D]/10 text-sm font-semibold text-[#FF7A3D]">{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</div>
              <div className="flex-1 overflow-hidden"><div className="truncate text-sm font-medium text-white">{user?.name}</div><div className="truncate text-xs text-gray-500">{user?.role}</div></div>
            </div>
            <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition-all hover:bg-white/10"><LogOut size={16} />Logout</button>
          </div>
        </div>
      </aside>
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0b0f14] lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF7A3D]"><Sparkles size={16} className="text-[#140A08]" strokeWidth={2.5} /></div><span className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>EduFlow</span></div>
          <div className="flex items-center gap-2"><NotificationBell /><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-400 hover:text-white">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button></div>
        </div>
        {mobileMenuOpen && <div className="border-t border-white/10 bg-[#0b0f14]"><nav className="space-y-1 p-4">{navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return <NavLink key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-[#FF7A3D]/10 text-[#FF7A3D]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Icon size={18} />{item.label}</NavLink>;
        })}<button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white"><LogOut size={18} />Logout</button></nav></div>}
      </div>
      <main className="flex-1 lg:pl-0"><div className="pt-16 lg:pt-0">{children}</div></main>
    </div>
  );
}
```

## `src/components/ProtectedRoute.tsx`

Authentication gate and protected-page wrapper.

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.tsx';
import { AppShell } from './AppShell.tsx';

export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  if (initializing) return <div className="flex min-h-screen items-center justify-center bg-black text-white"><span className="text-sm text-gray-400">Loading...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell><Outlet /></AppShell>;
}
```

## `src/components/NotificationBell.tsx`

Shared notification trigger and dropdown used by `AppShell`.

```tsx
import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Notification } from '@eduflow/shared';
import * as notificationApi from '../api/notifications.ts';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    load();
    const onDocClick = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);
  async function load() {
    try { const data = await notificationApi.getNotifications(); setNotifications(data.notifications); setPending(data.pending); }
    catch { /* Bell stays silent if notifications are unavailable. */ }
    finally { setLoading(false); }
  }
  return (
    <div className="relative" ref={containerRef}>
      <button onClick={() => setOpen(!open)} className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-white/5 hover:text-white" aria-label="Notifications">
        <Bell size={18} />
        {pending > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF7A3D] px-1 text-[10px] font-bold text-[#140A08]">{pending > 9 ? '9+' : pending}</span>}
      </button>
      {open && <div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-lg border border-white/10 bg-[#11161d] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><span className="text-sm font-semibold text-white">Notifications</span>{pending > 0 && <span className="text-xs text-[#FF7A3D]">{pending} pending</span>}</div>
        <div className="max-h-80 overflow-y-auto">{loading ? <div className="px-4 py-6 text-center text-sm text-gray-500">Loading...</div> : notifications.length === 0 ? <div className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet</div> : notifications.map((n) => <div key={n.id} className="border-b border-white/5 px-4 py-3 last:border-0"><div className="flex items-center gap-2"><span className="text-sm font-medium text-white">{n.title}</span><span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${n.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'}`}>{n.status === 'PENDING' ? 'PENDING' : 'SENT'}</span></div><p className="mt-1 text-xs text-gray-400">{n.message}</p><p className="mt-1 text-[10px] text-gray-600">{new Date(n.createdAt).toLocaleString()}</p></div>)}</div>
      </div>}
    </div>
  );
}
```
