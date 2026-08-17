import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, AlertTriangle, TrendingDown, Users, BookOpen, ArrowRight } from 'lucide-react';
import type { AttendanceTrendPoint, ClassAttendanceStat, Assignment } from '@eduflow/shared';
import type { LowAttendanceStudent } from '../../api/dashboard.ts';

interface Insight {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  action?: { label: string; path: string };
}

export function AIInsightsPanel({
  trend,
  classStats,
  lowAttendanceStudents,
  upcomingAssignments,
}: {
  trend: AttendanceTrendPoint[];
  classStats: ClassAttendanceStat[];
  lowAttendanceStudents: LowAttendanceStudent[];
  upcomingAssignments: Assignment[];
}) {
  const navigate = useNavigate();

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = [];

    // Low attendance students
    if (lowAttendanceStudents.length > 0) {
      const critical = lowAttendanceStudents.filter((s) => s.percentage < 60).length;
      result.push({
        id: 'low-attendance',
        type: critical > 0 ? 'danger' : 'warning',
        icon: AlertTriangle,
        title: `${lowAttendanceStudents.length} student${lowAttendanceStudents.length > 1 ? 's' : ''} below attendance threshold`,
        description: critical > 0
          ? `${critical} critically low. ${lowAttendanceStudents[0]?.name} is at ${lowAttendanceStudents[0]?.percentage.toFixed(0)}%.`
          : `${lowAttendanceStudents[0]?.name} is at ${lowAttendanceStudents[0]?.percentage.toFixed(0)}%.`,
        action: { label: 'View Students', path: '/dashboard/analytics' },
      });
    }

    // Attendance trend (compare last 7 vs previous 7)
    if (trend.length >= 14) {
      const recent = trend.slice(-7);
      const previous = trend.slice(-14, -7);
      const recentAvg = recent.reduce((s, t) => s + t.present, 0) / Math.max(recent.reduce((s, t) => s + t.total, 0), 1);
      const prevAvg = previous.reduce((s, t) => s + t.present, 0) / Math.max(previous.reduce((s, t) => s + t.total, 0), 1);
      const change = (recentAvg - prevAvg) * 100;

      if (change < -5) {
        result.push({
          id: 'trend-drop',
          type: 'danger',
          icon: TrendingDown,
          title: `Attendance dropped by ${Math.abs(change).toFixed(1)}% this week`,
          description: 'Compared to the previous week. Consider reviewing recent sessions.',
          action: { label: 'View Analytics', path: '/dashboard/analytics' },
        });
      } else if (change > 5) {
        result.push({
          id: 'trend-up',
          type: 'success',
          icon: TrendingDown,
          title: `Attendance improved by ${change.toFixed(1)}% this week`,
          description: 'Great progress compared to the previous week!',
        });
      }
    }

    // Class with lowest attendance
    if (classStats.length > 0) {
      const lowest = classStats.reduce((min, c) => (c.percentage < min.percentage ? c : min), classStats[0]);
      if (lowest.percentage < 80) {
        result.push({
          id: 'lowest-class',
          type: 'warning',
          icon: Users,
          title: `${lowest.class}-${lowest.division} has the lowest attendance`,
          description: `${lowest.percentage.toFixed(1)}% average across ${lowest.sessions} sessions.`,
          action: { label: 'View Analytics', path: '/dashboard/analytics' },
        });
      }
    }

    // Upcoming deadlines
    if (upcomingAssignments.length > 0) {
      const nextDeadline = new Date(upcomingAssignments[0].deadline);
      const daysUntil = Math.ceil((nextDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 3) {
        result.push({
          id: 'deadline',
          type: 'warning',
          icon: BookOpen,
          title: `Assignment due ${daysUntil <= 0 ? 'today' : `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`}`,
          description: `"${upcomingAssignments[0].title}" for ${upcomingAssignments[0].classId}-${upcomingAssignments[0].division}.`,
          action: { label: 'View Assignments', path: '/dashboard/assignments' },
        });
      }
    }

    // Overall health
    if (result.length === 0) {
      result.push({
        id: 'all-good',
        type: 'success',
        icon: Sparkles,
        title: 'All systems healthy',
        description: 'Attendance is on track and no immediate action is needed.',
      });
    }

    return result;
  }, [trend, classStats, lowAttendanceStudents, upcomingAssignments]);

  const typeStyles: Record<string, { border: string; bg: string; icon: string }> = {
    danger: { border: 'border-[var(--theme-danger)]/30', bg: 'bg-[var(--theme-danger)]/5', icon: 'text-[var(--theme-danger)]' },
    warning: { border: 'border-[var(--theme-warning)]/30', bg: 'bg-[var(--theme-warning)]/5', icon: 'text-[var(--theme-warning)]' },
    info: { border: 'border-[var(--theme-info)]/30', bg: 'bg-[var(--theme-info)]/5', icon: 'text-[var(--theme-info)]' },
    success: { border: 'border-[var(--theme-success)]/30', bg: 'bg-[var(--theme-success)]/5', icon: 'text-[var(--theme-success)]' },
  };

  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--theme-primary)]/10">
          <Sparkles size={14} className="text-[var(--theme-primary)]" />
        </div>
        <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          EduFlow AI Insights
        </h3>
      </div>

      <div className="space-y-3">
        {insights.map((insight) => {
          const style = typeStyles[insight.type];
          const Icon = insight.icon;
          return (
            <div
              key={insight.id}
              className={`rounded-lg border ${style.border} ${style.bg} p-4`}
            >
              <div className="flex items-start gap-3">
                <Icon size={16} className={`mt-0.5 shrink-0 ${style.icon}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--theme-fg)]">{insight.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--theme-muted)]">{insight.description}</p>
                  {insight.action && (
                    <button
                      onClick={() => navigate(insight.action!.path)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--theme-primary)] transition-colors hover:text-[var(--theme-primary-hover)]"
                    >
                      {insight.action.label}
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
