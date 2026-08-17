import { useNavigate } from 'react-router-dom';
import { Clock, Users, ArrowRight } from 'lucide-react';
import type { ClassAttendanceStat } from '@eduflow/shared';

export function TodaysClasses({ classStats }: { classStats: ClassAttendanceStat[] }) {
  const navigate = useNavigate();

  if (classStats.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-[var(--theme-primary)]" />
          <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Classes
          </h3>
        </div>
        <p className="text-sm text-[var(--theme-muted)]">
          No classes recorded yet. Start by taking attendance.
        </p>
        <button
          onClick={() => navigate('/dashboard/attendance')}
          className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--theme-primary)] transition-colors hover:text-[var(--theme-primary-hover)]"
        >
          Take Attendance <ArrowRight size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[var(--theme-primary)]" />
          <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Your Classes
          </h3>
        </div>
        <span className="text-xs text-[var(--theme-muted)]">{classStats.length} sections</span>
      </div>

      <div className="space-y-2">
        {classStats.map((cls) => (
          <div
            key={`${cls.class}-${cls.division}`}
            className="flex items-center justify-between rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-3 transition-all hover:border-[var(--theme-primary)]/20"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--theme-primary)]/10 text-xs font-bold text-[var(--theme-primary)]">
                {cls.class?.slice(-2) || '?'}
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--theme-fg)]">
                  {cls.class}-{cls.division}
                </div>
                <div className="text-[11px] text-[var(--theme-muted)]">
                  {cls.sessions} sessions
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div
                  className="text-sm font-bold"
                  style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    color:
                      cls.percentage >= 90
                        ? 'var(--theme-success)'
                        : cls.percentage >= 75
                          ? 'var(--theme-primary)'
                          : cls.percentage >= 60
                            ? 'var(--theme-warning)'
                            : 'var(--theme-danger)',
                  }}
                >
                  {cls.percentage.toFixed(1)}%
                </div>
              </div>
              <button
                onClick={() => navigate('/dashboard/attendance')}
                className="flex items-center gap-1 rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--theme-muted)] transition-all hover:border-[var(--theme-primary)]/30 hover:text-[var(--theme-fg)]"
              >
                <Users size={12} />
                Attendance
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
