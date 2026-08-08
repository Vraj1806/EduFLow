import type { ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';

export const inputClass =
  'h-11 w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-4 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] transition-all focus:border-[var(--theme-primary)]/50 focus:bg-[var(--theme-surface-raised)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20';

export const textareaClass =
  'w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-4 py-3 text-sm text-[var(--theme-fg)] placeholder:text-[var(--theme-muted)] transition-all focus:border-[var(--theme-primary)]/50 focus:bg-[var(--theme-surface-raised)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/20';

export const buttonPrimary =
  'flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--theme-primary)] px-5 text-sm font-semibold text-[var(--theme-primary-fg)] transition-all hover:bg-[var(--theme-primary-hover)] active:scale-95 disabled:opacity-50';

export const buttonSecondary =
  'flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-5 text-sm font-medium text-[var(--theme-fg)] transition-all hover:bg-[var(--theme-surface-raised)] disabled:opacity-50';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF7A3D]/20 border-t-[#FF7A3D]" />
      {label && <p className="mt-3 text-sm text-[var(--theme-muted)]">{label}</p>}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-[var(--theme-danger)]/20 bg-[var(--theme-danger)]/10 p-4">
      <AlertCircle className="mt-0.5 shrink-0 text-[var(--theme-danger)]" size={18} />
      <div className="text-sm text-[var(--theme-danger)]">{message}</div>
    </div>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--theme-success)]/20 bg-[var(--theme-success)]/10 p-4">
      <div className="text-sm text-[var(--theme-success)]">{message}</div>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)] px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--theme-surface-raised)]">
        <Inbox className="text-[var(--theme-muted)]" size={24} />
      </div>
      <p className="text-[var(--theme-muted)]">{title}</p>
      {hint && <p className="mt-1 text-sm text-[var(--theme-muted)]">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-[var(--theme-muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const tones: Record<string, string> = {
  green: 'bg-green-500/10 text-green-400 border-green-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  gray: 'bg-[var(--theme-surface-raised)] text-[var(--theme-muted)] border-[var(--theme-border)]',
  orange: 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border-[var(--theme-primary)]/20',
  blue: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  purple: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const iconTones: Record<string, string> = {
  green: 'text-green-400',
  amber: 'text-amber-400',
  red: 'text-red-400',
  gray: 'text-[var(--theme-muted)]',
  orange: 'text-[var(--theme-primary)]',
  blue: 'text-sky-400',
  purple: 'text-violet-400',
};

export function StatusBadge({
  label,
  tone = 'gray',
}: {
  label: string;
  tone?: 'green' | 'amber' | 'red' | 'gray' | 'orange';
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = 'orange',
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  hint?: string;
  tone?: 'green' | 'amber' | 'red' | 'gray' | 'orange' | 'blue' | 'purple';
}) {
  return (
    <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--theme-muted)]">
        <span className={iconTones[tone]}>{icon}</span>
        {label}
      </div>
      <div className="text-3xl font-bold tracking-tight text-[var(--theme-fg)]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-[var(--theme-muted)]">{hint}</div>}
    </div>
  );
}
