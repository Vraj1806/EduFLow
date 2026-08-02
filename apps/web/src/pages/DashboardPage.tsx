import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, CalendarCheck2, FileText, GraduationCap, Megaphone, Users } from 'lucide-react';
import type { AttendanceOverview } from '@eduflow/shared';
import * as analyticsApi from '../api/analytics.ts';
import { useAuth } from '../auth/AuthContext.tsx';
import { ErrorBanner, Spinner, StatCard } from '../components/ui.tsx';

interface QuickAction {
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
  ready: boolean;
}

function pct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const actions: QuickAction[] = [
    { title: 'Students', description: 'Manage profiles and face registration', icon: <Users size={22} />, path: '/dashboard/students', ready: true },
    { title: 'Attendance', description: 'Run sessions and mark attendance', icon: <CalendarCheck2 size={22} />, path: '/dashboard/attendance', ready: true },
    { title: 'Assignments', description: 'Create and track assignments', icon: <BookOpen size={22} />, path: '/dashboard/assignments', ready: true },
    { title: 'Notices', description: 'Publish notices to your classes', icon: <Megaphone size={22} />, path: '/dashboard/notices', ready: true },
    { title: 'Analytics', description: 'Class and trend performance', icon: <BarChart3 size={22} />, path: '/dashboard/analytics', ready: true },
    { title: 'Reports', description: 'Generate attendance reports', icon: <FileText size={22} />, path: '/dashboard/reports', ready: true },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f14] px-6 py-10 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Welcome back, {user?.name}
        </h1>
        <p className="mt-2 text-sm text-gray-400">Faculty Dashboard • Overview of your classroom</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <Spinner label="Loading dashboard…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Users size={18} />} label="Total Students" value={String(overview?.studentCount ?? 0)} tone="orange" />
            <StatCard icon={<CalendarCheck2 size={18} />} label="Completed Sessions" value={String(overview?.completedSessionCount ?? 0)} tone="green" />
            <StatCard icon={<GraduationCap size={18} />} label="Attendance Rate" value={pct(overview?.attendancePercentage ?? null)} tone="blue" />
            <StatCard icon={<BookOpen size={18} />} label="Upcoming Assignments" value={String(overview?.upcomingAssignments ?? 0)} tone="purple" />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StatCard icon={<Megaphone size={18} />} label="Published Notices" value={String(overview?.publishedNotices ?? 0)} tone="orange" />
            <StatCard icon={<Users size={18} />} label="Present Today" value={String(overview?.todayPresent ?? 0)} tone="green" />
          </div>
        </>
      )}

      {/* Quick Actions */}
      <h2 className="mb-4 mt-10 text-lg font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        Quick Actions
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <button
            key={action.title}
            onClick={() => navigate(action.path)}
            disabled={!action.ready}
            className={`group flex flex-col items-start gap-4 rounded-lg border border-white/10 bg-white/5 p-6 text-left transition-all ${
              action.ready ? 'hover:border-[#FF7A3D]/30 hover:bg-white/10' : 'opacity-50'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FF7A3D]/10 text-[#FF7A3D] transition-all group-hover:bg-[#FF7A3D]/20">
              {action.icon}
            </div>
            <div>
              <h3 className="mb-1 font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {action.title}
              </h3>
              <p className="text-sm text-gray-400">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
