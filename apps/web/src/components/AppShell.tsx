import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Bell,
  BarChart3,
  FileBarChart,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext.tsx';
import { NotificationBell } from './NotificationBell.tsx';

interface AppShellProps {
  children: ReactNode;
}

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
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r border-white/10 bg-[#0b0f14] lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF7A3D]">
                <Sparkles size={18} className="text-[#140A08]" strokeWidth={2.5} />
              </div>
              <span
                className="text-xl font-bold tracking-tight text-white"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                EduFlow
              </span>
            </div>
            <NotificationBell />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#FF7A3D]/10 text-[#FF7A3D]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF7A3D]/10 text-sm font-semibold text-[#FF7A3D]">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-sm font-medium text-white">{user?.name}</div>
                <div className="truncate text-xs text-gray-500">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition-all hover:bg-white/10"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0b0f14] lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF7A3D]">
              <Sparkles size={16} className="text-[#140A08]" strokeWidth={2.5} />
            </div>
            <span
              className="text-lg font-bold tracking-tight text-white"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              EduFlow
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#0b0f14]">
            <nav className="space-y-1 p-4">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#FF7A3D]/10 text-[#FF7A3D]'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <LogOut size={18} />
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pl-0">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
