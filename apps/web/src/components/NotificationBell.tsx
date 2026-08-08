import { Bell } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Notification } from '@eduflow/shared';
import * as notificationApi from '../api/notifications.ts';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  async function load() {
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data.notifications);
      setPending(data.pending);
    } catch {
      // Bell stays silent if notifications are unavailable.
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--theme-muted)] transition-all hover:bg-[var(--theme-surface)] hover:text-[var(--theme-fg)]"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {pending > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--theme-primary)] px-1 text-[10px] font-bold text-[var(--theme-primary-fg)]">
            {pending > 9 ? '9+' : pending}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--theme-fg)]">Notifications</span>
            {pending > 0 && (
              <span className="text-xs text-[var(--theme-primary)]">{pending} pending</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-[var(--theme-muted)]">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[var(--theme-muted)]">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="border-b border-[var(--theme-border)] px-4 py-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--theme-fg)]">{n.title}</span>
                    <span
                      className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        n.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-green-500/10 text-green-400'
                      }`}
                    >
                      {n.status === 'PENDING' ? 'PENDING' : 'SENT'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--theme-muted)]">{n.message}</p>
                  <p className="mt-1 text-[10px] text-[var(--theme-muted)]">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
