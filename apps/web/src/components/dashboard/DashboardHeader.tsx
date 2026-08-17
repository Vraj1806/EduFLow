import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Camera,
  FileText,
  Megaphone,
  BarChart3,
  Clock,
  Search,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext.tsx';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getGreetingEmoji(): string {
  const h = new Date().getHours();
  if (h < 12) return '\u{1F305}';
  if (h < 17) return '\u{2600}\u{FE0F}';
  return '\u{1F319}';
}

const quickActions = [
  { label: 'Take Attendance', icon: Camera, path: '/dashboard/attendance', color: 'var(--theme-primary)' },
  { label: 'Add Assignment', icon: FileText, path: '/dashboard/assignments', color: 'var(--theme-info)' },
  { label: 'Create Notice', icon: Megaphone, path: '/dashboard/notices', color: 'var(--theme-secondary)' },
  { label: 'View Reports', icon: BarChart3, path: '/dashboard/reports', color: 'var(--theme-success)' },
];

export function DashboardHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.header
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
      className="mb-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight lg:text-4xl"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            {getGreeting()}, {user?.name?.split(' ')[0]} {getGreetingEmoji()}
          </h1>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">
            Here's what's happening with your classes today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-medium text-[var(--theme-muted)]">
            <Clock size={14} className="text-[var(--theme-primary)]" />
            {dateStr}
          </div>
          <button
            onClick={() => navigate('/dashboard/analytics')}
            className="flex items-center gap-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-medium text-[var(--theme-muted)] transition-all hover:border-[var(--theme-primary)]/40 hover:text-[var(--theme-fg)]"
          >
            <Search size={14} />
            Search
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              whileHover={reducedMotion ? {} : { scale: 1.02 }}
              whileTap={reducedMotion ? {} : { scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2.5 text-sm font-medium text-[var(--theme-fg)] shadow-sm transition-all hover:border-[var(--theme-primary)]/30 hover:shadow-md"
            >
              <Icon size={16} style={{ color: action.color }} />
              {action.label}
            </motion.button>
          );
        })}
      </div>
    </motion.header>
  );
}
