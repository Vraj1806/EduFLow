import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { AttendanceTrendPoint } from '@eduflow/shared';

type TimeRange = 7 | 14 | 30;

export function AttendanceTrendChart({ trend }: { trend: AttendanceTrendPoint[] }) {
  const [range, setRange] = useState<TimeRange>(14);

  const data = trend.slice(-range).map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-[var(--theme-primary)]" />
          <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Attendance Trend
          </h3>
        </div>
        <p className="text-sm text-[var(--theme-muted)]">No attendance data available yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-[var(--theme-primary)]" />
          <h3 className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Attendance Trend
          </h3>
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] p-0.5">
          {([7, 14, 30] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                range === r
                  ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-fg)]'
                  : 'text-[var(--theme-muted)] hover:text-[var(--theme-fg)]'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--theme-primary)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--theme-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--theme-muted)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--theme-muted)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--theme-muted)' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--theme-muted)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--theme-surface)',
                border: '1px solid var(--theme-border)',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: 'var(--theme-card-shadow)',
              }}
              labelStyle={{ color: 'var(--theme-fg)', fontWeight: 600 }}
              itemStyle={{ color: 'var(--theme-muted)' }}
            />
            <Area
              type="monotone"
              dataKey="present"
              stroke="var(--theme-primary)"
              strokeWidth={2}
              fill="url(#presentGrad)"
              name="Present"
            />
            <Area
              type="monotone"
              dataKey="absent"
              stroke="var(--theme-muted)"
              strokeWidth={1.5}
              fill="url(#absentGrad)"
              name="Absent"
              strokeDasharray="4 4"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex gap-4 text-xs text-[var(--theme-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[var(--theme-primary)]" /> Present
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-[var(--theme-muted)]" /> Absent
        </span>
      </div>
    </div>
  );
}
