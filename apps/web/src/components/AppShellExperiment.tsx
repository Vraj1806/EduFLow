import { useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Bell,
  BarChart3,
  FileBarChart,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext.tsx';
import { NotificationBell } from './NotificationBell.tsx';

interface AppShellExperimentProps {
  children: ReactNode;
}

const navSections = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/dashboard/students', label: 'Students', icon: Users },
      { path: '/dashboard/attendance', label: 'Attendance', icon: ClipboardCheck },
      { path: '/dashboard/assignments', label: 'Assignments', icon: FileText },
      { path: '/dashboard/notices', label: 'Notices', icon: Bell },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/dashboard/reports', label: 'Reports', icon: FileBarChart },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      { path: '/dashboard/help', label: 'Help / Support', icon: HelpCircle },
    ],
  },
];

const allNavItems = navSections.flatMap((s) => s.items);

export function AppShellExperiment({ children }: AppShellExperimentProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function isActive(path: string): boolean {
    return (
      location.pathname === path ||
      (path !== '/dashboard' && location.pathname.startsWith(path))
    );
  }

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-fg)]">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--theme-border)] bg-[var(--theme-sidebar-bg)] lg:flex">
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--theme-primary)] shadow-lg shadow-[var(--theme-primary)]/20">
              <Sparkles size={18} className="text-[var(--theme-bg)]" strokeWidth={2.5} />
            </div>
            <div>
              <span
                className="block text-lg font-bold tracking-tight text-[var(--theme-fg)]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                EduFlow
              </span>
              <span className="block text-[10px] font-medium tracking-wide text-[var(--theme-muted)]">
                AI-Powered Faculty Platform
              </span>
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section, si) => (
            <div key={section.label} className={si > 0 ? 'mt-6' : ''}>
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--theme-muted)]">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] shadow-sm'
                          : 'text-[var(--theme-muted)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-fg)]'
                      }`}
                    >
                      <Icon
                        size={18}
                        className={`transition-colors ${
                          active
                            ? 'text-[var(--theme-primary)]'
                            : 'text-[var(--theme-muted)] group-hover:text-[var(--theme-fg)]'
                        }`}
                      />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-[var(--theme-border)] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-[var(--theme-surface)] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--theme-primary)]/10 text-sm font-semibold text-[var(--theme-primary)]">
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-sm font-medium text-[var(--theme-fg)]">
                {user?.name}
              </div>
              <div className="truncate text-xs text-[var(--theme-muted)]">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm text-[var(--theme-muted)] transition-all hover:border-[var(--theme-primary)]/30 hover:text-[var(--theme-fg)]"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--theme-border)] bg-[var(--theme-sidebar-bg)] lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-primary)]">
              <Sparkles size={16} className="text-[var(--theme-bg)]" strokeWidth={2.5} />
            </div>
            <div>
              <span
                className="block text-lg font-bold tracking-tight text-[var(--theme-fg)]"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                EduFlow
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              className="rounded-lg p-1 text-[var(--theme-muted)] transition-colors hover:text-[var(--theme-fg)]"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="overflow-hidden border-t border-[var(--theme-border)] bg-[var(--theme-sidebar-bg)]"
            >
              <div className="space-y-1 p-4">
                {allNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]'
                          : 'text-[var(--theme-muted)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-fg)]'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </NavLink>
                  );
                })}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--theme-muted)] transition-all hover:bg-[var(--theme-surface)] hover:text-[var(--theme-fg)]"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">{children}</div>
      </main>
    </div>
  );
}
