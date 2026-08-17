import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Calendar, Clock } from 'lucide-react';
import type { Assignment } from '@eduflow/shared';

function getDeadlineStatus(deadline: string): { label: string; color: string } {
  const now = new Date();
  const d = new Date(deadline);
  const daysUntil = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return { label: 'Overdue', color: 'var(--theme-danger)' };
  if (daysUntil === 0) return { label: 'Due today', color: 'var(--theme-warning)' };
  if (daysUntil <= 3) return { label: `${daysUntil}d left`, color: 'var(--theme-warning)' };
  if (daysUntil <= 7) return { label: `${daysUntil}d left`, color: 'var(--theme-primary)' };
  return { label: `${daysUntil}d left`, color: 'var(--theme-success)' };
}

export function RecentAssignments({ assignments }: { assignments: Assignment[] }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-[var(--theme-primary)]" />
          <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Recent Assignments
          </h3>
        </div>
        <button
          onClick={() => navigate('/dashboard/assignments')}
          className="flex items-center gap-1 text-xs font-medium text-[var(--theme-primary)] transition-colors hover:text-[var(--theme-primary-hover)]"
        >
          View All <ArrowRight size={12} />
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="py-6 text-center">
          <BookOpen size={24} className="mx-auto mb-2 text-[var(--theme-muted)]" />
          <p className="text-sm text-[var(--theme-muted)]">No upcoming assignments</p>
          <button
            onClick={() => navigate('/dashboard/assignments')}
            className="mt-2 text-xs font-medium text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]"
          >
            Create an assignment
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => {
            const deadline = getDeadlineStatus(assignment.deadline);
            return (
              <div
                key={assignment.id}
                className="group flex items-start gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-3 transition-all hover:border-[var(--theme-primary)]/20"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--theme-info)]/10">
                  <BookOpen size={12} className="text-[var(--theme-info)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--theme-fg)]">
                    {assignment.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--theme-muted)]">
                    <Calendar size={10} />
                    {new Date(assignment.deadline).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                    <span className="rounded-full bg-[var(--theme-surface-raised)] px-2 py-0.5">
                      {assignment.classId}-{assignment.division}
                    </span>
                  </div>
                </div>
                <span
                  className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${deadline.color} 15%, transparent)`,
                    color: deadline.color,
                  }}
                >
                  <Clock size={10} />
                  {deadline.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
