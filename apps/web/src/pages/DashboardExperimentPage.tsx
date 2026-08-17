import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import type { DashboardSummary } from '../api/dashboard.ts';
import { getDashboardSummary } from '../api/dashboard.ts';
import { ErrorBanner } from '../components/ui.tsx';
import {
  DashboardHeader,
  StatsGrid,
  AttendanceTrendChart,
  ClassComparisonChart,
  TeachingActivityHeatmap,
  AIInsightsPanel,
  TodaysClasses,
  AttendanceOverview,
  RecentNotices,
  RecentAssignments,
  LowAttendanceAlerts,
  SkeletonCard,
  SkeletonChart,
  SkeletonList,
  SkeletonHeatmap,
} from '../components/dashboard/index.ts';

export function DashboardExperimentPage() {
  const reducedMotion = useReducedMotion();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await getDashboardSummary();
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] px-4 py-6 text-[var(--theme-fg)] sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <DashboardHeader />

      {error && <ErrorBanner message={error} />}

      {/* Loading State */}
      {loading && !data && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonChart />
            <SkeletonList />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonHeatmap />
            <SkeletonList />
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      {data && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
          className="space-y-6"
        >
          {/* KPI Stats */}
          <StatsGrid overview={data.overview} trend={data.trend} />

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AttendanceTrendChart trend={data.trend} />
            <ClassComparisonChart classes={data.classStats} />
          </div>

          {/* Heatmap + AI Insights */}
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <TeachingActivityHeatmap activity={data.activity} />
            </div>
            <div className="lg:col-span-2">
              <AIInsightsPanel
                trend={data.trend}
                classStats={data.classStats}
                lowAttendanceStudents={data.lowAttendanceStudents}
                upcomingAssignments={data.upcomingAssignments}
              />
            </div>
          </div>

          {/* Classes + Attendance Overview */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TodaysClasses classStats={data.classStats} />
            <AttendanceOverview classes={data.classStats} />
          </div>

          {/* Recent Activity Row */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <RecentNotices notices={data.recentNotices} />
            <RecentAssignments assignments={data.upcomingAssignments} />
            <LowAttendanceAlerts students={data.lowAttendanceStudents} />
          </div>

          {/* Refresh Button */}
          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={load}
              className="flex items-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2.5 text-sm font-medium text-[var(--theme-muted)] transition-all hover:border-[var(--theme-primary)]/30 hover:text-[var(--theme-fg)]"
            >
              <RefreshCw size={14} />
              Refresh Dashboard
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
