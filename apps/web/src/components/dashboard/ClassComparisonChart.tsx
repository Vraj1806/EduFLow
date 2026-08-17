import { Users } from 'lucide-react';
import type { ClassAttendanceStat } from '@eduflow/shared';

function getBarColor(pct: number): string {
  if (pct >= 90) return 'var(--theme-success)';
  if (pct >= 75) return 'var(--theme-primary)';
  if (pct >= 60) return 'var(--theme-warning)';
  return 'var(--theme-danger)';
}

function getStatusLabel(pct: number): string {
  if (pct >= 90) return 'Excellent';
  if (pct >= 75) return 'Good';
  if (pct >= 60) return 'Warning';
  return 'Critical';
}

export function ClassComparisonChart({ classes }: { classes: ClassAttendanceStat[] }) {
  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
      <div className="mb-4 flex items-center gap-2">
        <Users size={16} className="text-[var(--theme-primary)]" />
        <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Class Attendance
        </h3>
      </div>

      {classes.length === 0 ? (
        <p className="text-sm text-[var(--theme-muted)]">No class data available yet.</p>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => {
            const color = getBarColor(cls.percentage);
            const label = getStatusLabel(cls.percentage);
            return (
              <div key={`${cls.class}-${cls.division}`}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--theme-fg)]">
                      {cls.class}-{cls.division}
                    </span>
                    <span className="text-[11px] text-[var(--theme-muted)]">
                      {cls.sessions} sessions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                        color,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ fontFamily: 'Space Grotesk, sans-serif', color }}
                    >
                      {cls.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--theme-bg)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(cls.percentage, 1)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
