export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 ${className}`}
    >
      <div className="mb-3 h-4 w-24 rounded bg-[var(--theme-surface-raised)]" />
      <div className="mb-2 h-8 w-20 rounded bg-[var(--theme-surface-raised)]" />
      <div className="h-3 w-32 rounded bg-[var(--theme-surface-raised)]" />
    </div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 ${className}`}
    >
      <div className="mb-4 h-5 w-40 rounded bg-[var(--theme-surface-raised)]" />
      <div className="flex items-end gap-2 pt-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-[var(--theme-surface-raised)]"
              style={{ height: `${20 + Math.random() * 80}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 4, className = '' }: { rows?: number; className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5 ${className}`}
    >
      <div className="mb-4 h-5 w-32 rounded bg-[var(--theme-surface-raised)]" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[var(--theme-surface-raised)]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-3/4 rounded bg-[var(--theme-surface-raised)]" />
              <div className="h-3 w-1/2 rounded bg-[var(--theme-surface-raised)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonHeatmap({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 ${className}`}
    >
      <div className="mb-4 h-5 w-40 rounded bg-[var(--theme-surface-raised)]" />
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <div className="space-y-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 w-8 rounded bg-[var(--theme-surface-raised)]" />
          ))}
        </div>
        <div className="grid grid-cols-52 gap-1">
          {Array.from({ length: 364 }).map((_, i) => (
            <div key={i} className="h-3 w-3 rounded-sm bg-[var(--theme-surface-raised)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
