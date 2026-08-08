import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Users,
  CalendarCheck2,
  GraduationCap,
  BookOpen,
  Megaphone,
  BarChart3,
  FileText,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react';
import type { AttendanceOverview } from '@eduflow/shared';
import * as analyticsApi from '../api/analytics.ts';
import { useAuth } from '../auth/AuthContext.tsx';
import { ErrorBanner, Spinner } from '../components/ui.tsx';

type StatTone = 'orange' | 'green' | 'blue' | 'purple';

interface Stat {
  label: string;
  value: string;
  icon: ReactNode;
  tone: StatTone;
  hint?: ReactNode;
}

interface QuickAction {
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
}

const toneClasses: Record<StatTone, { circle: string; icon: string }> = {
  orange: { circle: 'bg-[var(--theme-primary)]/10', icon: 'text-[var(--theme-primary)]' },
  green: { circle: 'bg-[var(--theme-success)]/10', icon: 'text-[var(--theme-success)]' },
  blue: { circle: 'bg-[var(--theme-info)]/10', icon: 'text-[var(--theme-info)]' },
  purple: { circle: 'bg-[var(--theme-secondary)]/10', icon: 'text-[var(--theme-secondary)]' },
};

function pct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

export function DashboardExperimentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [overview, setOverview] = useState<AttendanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setOverview(await analyticsApi.getOverview());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const staggerContainer: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reducedMotion ? 0 : 0.07 },
    },
  };

  const staggerItem: Variants = {
    hidden: reducedMotion ? {} : { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' },
    },
  };

  const stats: Stat[] = [
    {
      label: 'Total Students',
      value: String(overview?.studentCount ?? 0),
      icon: <Users size={18} />,
      tone: 'orange',
    },
    {
      label: 'Completed Sessions',
      value: String(overview?.completedSessionCount ?? 0),
      icon: <CalendarCheck2 size={18} />,
      tone: 'green',
    },
    {
      label: 'Attendance Rate',
      value: pct(overview?.attendancePercentage ?? null),
      icon: <GraduationCap size={18} />,
      tone: 'blue',
      hint: (
        <span className="flex items-center gap-1">
          <TrendingUp size={11} />
          across all sessions
        </span>
      ),
    },
    {
      label: 'Upcoming Assignments',
      value: String(overview?.upcomingAssignments ?? 0),
      icon: <BookOpen size={18} />,
      tone: 'purple',
      hint: (
        <span className="flex items-center gap-1">
          <Clock size={11} />
          coming up next
        </span>
      ),
    },
  ];

  const actions: QuickAction[] = [
    { title: 'Students', description: 'Manage profiles and face registration', icon: <Users size={22} />, path: '/dashboard/students' },
    { title: 'Attendance', description: 'Run sessions and mark attendance', icon: <CalendarCheck2 size={22} />, path: '/dashboard/attendance' },
    { title: 'Assignments', description: 'Create and track assignments', icon: <BookOpen size={22} />, path: '/dashboard/assignments' },
    { title: 'Notices', description: 'Publish notices to your classes', icon: <Megaphone size={22} />, path: '/dashboard/notices' },
    { title: 'Analytics', description: 'Class and trend performance', icon: <BarChart3 size={22} />, path: '/dashboard/analytics' },
    { title: 'Reports', description: 'Generate attendance reports', icon: <FileText size={22} />, path: '/dashboard/reports' },
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] px-6 py-10 text-[var(--theme-fg)] lg:px-10 lg:py-12">
      {/* Header */}
      <motion.header
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
        className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--theme-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--theme-primary)]">
            <Sparkles size={14} />
            Dashboard Overview
          </div>
          <h1
            className="text-3xl font-bold tracking-tight lg:text-4xl"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Welcome back, {user?.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--theme-muted)]">
            Faculty Dashboard • Premium overview of your classroom
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 self-start rounded-full border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2 text-xs font-medium text-[var(--theme-muted)] lg:self-auto">
          <Clock size={14} className="text-[var(--theme-primary)]" />
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </motion.header>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <Spinner label="Loading dashboard…" />
      ) : (
        <>
          {/* Stats Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={staggerItem}
                className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 shadow-[var(--theme-card-shadow)]"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClasses[stat.tone].circle} ${toneClasses[stat.tone].icon}`}
                >
                  {stat.icon}
                </span>
                <div className="mb-1 mt-4 text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">
                  {stat.label}
                </div>
                <div
                  className="text-3xl font-bold tracking-tight"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  {stat.value}
                </div>
                {stat.hint && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--theme-muted)]">
                    {stat.hint}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <h2
            className="mb-6 mt-12 text-xl font-semibold tracking-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Quick Actions
          </h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {actions.map((action) => (
              <motion.button
                key={action.title}
                variants={staggerItem}
                onClick={() => navigate(action.path)}
                className="group relative flex flex-col items-start gap-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 text-left shadow-[var(--theme-card-shadow)] transition-all hover:border-[var(--theme-primary)]/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3
                    className="mb-1 font-semibold text-[var(--theme-fg)]"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {action.title}
                  </h3>
                  <p className="text-sm text-[var(--theme-muted)]">{action.description}</p>
                </div>
                <ArrowRight
                  size={18}
                  className="absolute right-5 top-6 text-[var(--theme-primary)] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                />
              </motion.button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
