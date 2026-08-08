import { useCallback, useEffect, useState } from 'react';
import { BarChart3, BookOpen, CalendarCheck2, GraduationCap, Megaphone, Users } from 'lucide-react';
import type { AttendanceOverview, AttendanceTrendPoint, ClassAttendanceStat } from '@eduflow/shared';
import * as analyticsApi from '../api/analytics.ts';
import { ErrorBanner, PageHeader, Spinner, StatCard, buttonSecondary } from '../components/ui.tsx';
import { PageWrapper } from '../components/PageWrapper.tsx';

function pct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

function TrendChart({ trend }: { trend: AttendanceTrendPoint[] }) {
  if (trend.length === 0) return <p className="text-sm text-[var(--theme-muted)]">No attendance data for the selected period.</p>;

  const max = Math.max(...trend.map((p) => p.total), 1);

  return (
    <div className="flex items-end gap-2 overflow-x-auto pb-1">
      {trend.map((point) => {
        const presentH = Math.round((point.present / max) * 120);
        const absentH = Math.round((point.absent / max) * 120);
        return (
          <div key={point.date} className="flex min-w-[28px] flex-col items-center gap-1">
            <div className="flex h-[130px] items-end gap-[2px]">
              <div
                className="w-2 rounded-t bg-[var(--theme-primary)]"
                style={{ height: `${Math.max(presentH, 2)}px` }}
                title={`Present: ${point.present}`}
              />
              <div
                className="w-2 rounded-t bg-[var(--theme-muted)]"
                style={{ height: `${Math.max(absentH, 2)}px` }}
                title={`Absent: ${point.absent}`}
              />
            </div>
            <span className="text-[10px] text-[var(--theme-muted)]">
              {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsPage() {
  const [overview, setOverview] = useState<AttendanceOverview | null>(null);
  const [trend, setTrend] = useState<AttendanceTrendPoint[]>([]);
  const [classes, setClasses] = useState<ClassAttendanceStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, trendData, classesData] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getTrend(14),
        analyticsApi.getClassStats(),
      ]);
      setOverview(overviewData);
      setTrend(trendData.trend);
      setClasses(classesData.classes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageWrapper className="min-h-screen bg-[var(--theme-bg)] px-6 py-10 text-[var(--theme-fg)]">
      <PageHeader
        title="Analytics"
        subtitle="Track attendance performance across your classes"
        action={
          <button onClick={load} className={buttonSecondary}>
            <BarChart3 size={16} />
            Refresh
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <Spinner label="Loading analytics…" />
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Users size={18} />}
              label="Total Students"
              value={String(overview?.studentCount ?? 0)}
              tone="orange"
            />
            <StatCard
              icon={<CalendarCheck2 size={18} />}
              label="Completed Sessions"
              value={String(overview?.completedSessionCount ?? 0)}
              tone="green"
            />
            <StatCard
              icon={<GraduationCap size={18} />}
              label="Attendance Rate"
              value={pct(overview?.attendancePercentage ?? null)}
              tone="blue"
            />
            <StatCard
              icon={<BookOpen size={18} />}
              label="Upcoming Assignments"
              value={String(overview?.upcomingAssignments ?? 0)}
              tone="purple"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StatCard
              icon={<Users size={18} />}
              label="Present Today"
              value={String(overview?.todayPresent ?? 0)}
              tone="green"
            />
            <StatCard
              icon={<Users size={18} />}
              label="Absent Today"
              value={String(overview?.todayAbsent ?? 0)}
              tone="red"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {/* Trend chart */}
            <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-[var(--theme-primary)]" />
                <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Attendance Trend (14 days)
                </h3>
              </div>
              <TrendChart trend={trend} />
              <div className="mt-4 flex gap-4 text-xs text-[var(--theme-muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-[var(--theme-primary)]" /> Present
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-[var(--theme-muted)]" /> Absent
                </span>
              </div>
            </div>

            {/* Class stats */}
            <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
              <div className="mb-4 flex items-center gap-2">
                <Users size={16} className="text-[var(--theme-primary)]" />
                <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Class Performance
                </h3>
              </div>
              {classes.length === 0 ? (
                <p className="text-sm text-[var(--theme-muted)]">No class data available yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--theme-border)] text-left text-xs uppercase tracking-wide text-[var(--theme-muted)]">
                      <th className="pb-2 pr-2">Class</th>
                      <th className="pb-2 pr-2">Sessions</th>
                      <th className="pb-2 pr-2">Present</th>
                      <th className="pb-2 pr-2">Absent</th>
                      <th className="pb-2 text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => (
                      <tr key={`${cls.class}-${cls.division}`} className="border-b border-[var(--theme-border)] last:border-0">
                        <td className="py-2.5 pr-2 font-medium text-[var(--theme-fg)]">
                          {cls.class} {cls.division}
                        </td>
                        <td className="py-2.5 pr-2 text-[var(--theme-muted)]">{cls.sessions}</td>
                        <td className="py-2.5 pr-2 text-[var(--theme-success)]">{cls.present}</td>
                        <td className="py-2.5 pr-2 text-[var(--theme-danger)]">{cls.absent}</td>
                        <td className="py-2.5 text-right">
                          <span className="rounded-full bg-[var(--theme-primary)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--theme-primary)]">
                            {cls.percentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StatCard
              icon={<Megaphone size={18} />}
              label="Published Notices"
              value={String(overview?.publishedNotices ?? 0)}
              tone="orange"
            />
            <StatCard
              icon={<BarChart3 size={18} />}
              label="Pending Notifications"
              value={String(overview?.pendingNotifications ?? 0)}
              tone="gray"
            />
          </div>
        </>
      )}
    </PageWrapper>
  );
}
