import { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import type { ActivityDay } from '../../api/dashboard.ts';

type HeatmapRange = 3 | 6 | 12;

function getIntensity(count: number, max: number): number {
  if (count === 0 || max === 0) return 0;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const intensityColors = [
  'var(--theme-bg)',
  'rgba(255, 122, 61, 0.15)',
  'rgba(255, 122, 61, 0.35)',
  'rgba(255, 122, 61, 0.6)',
  'rgba(255, 122, 61, 0.85)',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TeachingActivityHeatmap({ activity }: { activity: ActivityDay[] }) {
  const [range, setRange] = useState<HeatmapRange>(12);

  const { grid, maxCount, monthLabels } = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (range * 30 - 1));
    startDate.setHours(0, 0, 0, 0);

    const activityMap = new Map<string, number>();
    for (const day of activity) {
      activityMap.set(day.date, day.count);
    }

    const weeks: { date: Date; count: number }[][] = [];
    let currentWeek: { date: Date; count: number }[] = [];

    const d = new Date(startDate);
    const dayOfWeek = d.getDay();
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({ date: new Date(d), count: 0 });
      d.setDate(d.getDate() + 1);
    }

    let maxCount = 0;
    const monthSet = new Map<number, number>();

    while (d <= now) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const count = activityMap.get(key) ?? 0;
      if (count > maxCount) maxCount = count;

      const weekIdx = weeks.length;
      if (!monthSet.has(d.getMonth()) || d.getDate() <= 7) {
        monthSet.set(d.getMonth(), weekIdx);
      }

      currentWeek.push({ date: new Date(d), count });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(d), count: 0 });
      }
      weeks.push(currentWeek);
    }

    const monthLabels: { label: string; weekIdx: number }[] = [];
    monthSet.forEach((weekIdx, month) => {
      monthLabels.push({ label: MONTHS[month], weekIdx });
    });

    return { grid: weeks, maxCount, monthLabels };
  }, [activity, range]);

  const totalActivities = activity.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-[var(--theme-primary)]" />
            <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Teaching Activity
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-[var(--theme-muted)]">
            {totalActivities} activities over the last {range} months
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-0.5">
          {([3, 6, 12] as HeatmapRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                range === r
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-fg)]'
                  : 'text-[var(--theme-muted)] hover:text-[var(--theme-fg)]'
              }`}
            >
              {r}m
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-fit">
          {/* Month labels */}
          <div className="mb-1 flex pl-10">
            {monthLabels.map(({ label, weekIdx }) => (
              <div
                key={`${label}-${weekIdx}`}
                className="text-[10px] text-[var(--theme-muted)]"
                style={{ marginLeft: weekIdx === 0 ? 0 : undefined }}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] pr-1">
              {DAYS.map((day, i) => (
                <div key={day} className="flex h-3 items-center text-[9px] text-[var(--theme-muted)]">
                  {i % 2 === 1 ? day.slice(0, 2) : ''}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-[3px]">
              {grid.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => {
                    const intensity = getIntensity(day.count, maxCount);
                    return (
                      <div
                        key={di}
                        className="h-3 w-3 rounded-sm transition-colors"
                        style={{ backgroundColor: intensityColors[intensity] }}
                        title={`${day.date.toLocaleDateString()}: ${day.count} activities`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-1 pl-10 text-[10px] text-[var(--theme-muted)]">
            <span>Less</span>
            {intensityColors.map((color, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
