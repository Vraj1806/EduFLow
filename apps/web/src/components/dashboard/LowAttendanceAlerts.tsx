import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, User } from 'lucide-react';
import type { LowAttendanceStudent } from '../../api/dashboard.ts';

function getSeverity(percentage: number): { label: string; color: string } {
  if (percentage < 50) return { label: 'Critical', color: 'var(--theme-danger)' };
  if (percentage < 60) return { label: 'Severe', color: 'var(--theme-danger)' };
  if (percentage < 70) return { label: 'Warning', color: 'var(--theme-warning)' };
  return { label: 'At Risk', color: 'var(--theme-warning)' };
}

export function LowAttendanceAlerts({ students }: { students: LowAttendanceStudent[] }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--theme-danger)]/10">
            <AlertTriangle size={14} className="text-[var(--theme-danger)]" />
          </div>
          <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Low Attendance Alerts
          </h3>
        </div>
        {students.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--theme-danger)]/10 px-1.5 text-[10px] font-bold text-[var(--theme-danger)]">
            {students.length}
          </span>
        )}
      </div>

      {students.length === 0 ? (
        <div className="py-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-success)]/10">
            <AlertTriangle size={18} className="text-[var(--theme-success)]" />
          </div>
          <p className="text-sm font-medium text-[var(--theme-fg)]">All students healthy</p>
          <p className="mt-0.5 text-xs text-[var(--theme-muted)]">
            No students below the attendance threshold
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => {
            const severity = getSeverity(student.percentage);
            return (
              <div
                key={student.studentId}
                className="flex items-center gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-3 transition-all hover:border-[var(--theme-danger)]/20"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--theme-surface-raised)]">
                  <User size={14} className="text-[var(--theme-muted)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--theme-fg)]">
                    {student.name}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[var(--theme-muted)]">
                    <span>{student.class}-{student.division}</span>
                    <span>·</span>
                    <span>{student.present}/{student.total} sessions</span>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-sm font-bold"
                    style={{ fontFamily: 'Space Grotesk, sans-serif', color: severity.color }}
                  >
                    {student.percentage.toFixed(0)}%
                  </div>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${severity.color} 15%, transparent)`,
                      color: severity.color,
                    }}
                  >
                    {severity.label}
                  </span>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => navigate('/dashboard/analytics')}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] py-2 text-xs font-medium text-[var(--theme-muted)] transition-all hover:border-[var(--theme-primary)]/30 hover:text-[var(--theme-fg)]"
          >
            View All Analytics <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
