import { useNavigate } from 'react-router-dom';
import { Megaphone, ArrowRight, Calendar } from 'lucide-react';
import type { Notice } from '@eduflow/shared';

export function RecentNotices({ notices }: { notices: Notice[] }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone size={16} className="text-[var(--theme-primary)]" />
          <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Recent Notices
          </h3>
        </div>
        <button
          onClick={() => navigate('/dashboard/notices')}
          className="flex items-center gap-1 text-xs font-medium text-[var(--theme-primary)] transition-colors hover:text-[var(--theme-primary-hover)]"
        >
          View All <ArrowRight size={12} />
        </button>
      </div>

      {notices.length === 0 ? (
        <div className="py-6 text-center">
          <Megaphone size={24} className="mx-auto mb-2 text-[var(--theme-muted)]" />
          <p className="text-sm text-[var(--theme-muted)]">No notices published yet</p>
          <button
            onClick={() => navigate('/dashboard/notices')}
            className="mt-2 text-xs font-medium text-[var(--theme-primary)] hover:text-[var(--theme-primary-hover)]"
          >
            Create a notice
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className="group flex items-start gap-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-3 transition-all hover:border-[var(--theme-primary)]/20"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--theme-primary)]/10">
                <Megaphone size={12} className="text-[var(--theme-primary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--theme-fg)]">{notice.title}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--theme-muted)]">
                  <Calendar size={10} />
                  {notice.publishedAt
                    ? new Date(notice.publishedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Draft'}
                  {notice.targetClass && (
                    <span className="rounded-full bg-[var(--theme-surface-raised)] px-2 py-0.5">
                      {notice.targetClass}{notice.targetDiv ? `-${notice.targetDiv}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
