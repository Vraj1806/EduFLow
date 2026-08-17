import { type ReactNode } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import {
  Users,
  CalendarCheck2,
  GraduationCap,
  BookOpen,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react';
import type { AttendanceOverview, AttendanceTrendPoint } from '@eduflow/shared';

type StatTone = 'orange' | 'green' | 'blue' | 'purple' | 'red';

interface Stat {
  label: string;
  value: string;
  icon: ReactNode;
  tone: StatTone;
  hint?: ReactNode;
  sparkline?: number[];
}

const toneStyles: Record<StatTone, { bg: string; text: string; sparkline: string }> = {
  orange: { bg: 'bg-[var(--theme-primary)]/10', text: 'text-[var(--theme-primary)]', sparkline: 'var(--theme-primary)' },
  green: { bg: 'bg-[var(--theme-success)]/10', text: 'text-[var(--theme-success)]', sparkline: 'var(--theme-success)' },
  blue: { bg: 'bg-[var(--theme-info)]/10', text: 'text-[var(--theme-info)]', sparkline: 'var(--theme-info)' },
  purple: { bg: 'bg-[var(--theme-secondary)]/10', text: 'text-[var(--theme-secondary)]', sparkline: 'var(--theme-secondary)' },
  red: { bg: 'bg-[var(--theme-danger)]/10', text: 'text-[var(--theme-danger)]', sparkline: 'var(--theme-danger)' },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80;
  const h = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

function pct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

export function StatsGrid({
  overview,
  trend,
}: {
  overview: AttendanceOverview;
  trend: AttendanceTrendPoint[];
}) {
  const reducedMotion = useReducedMotion();

  const recentTrend = trend.slice(-7);
  const presentTrend = recentTrend.map((t) => t.present);
  const absentTrend = recentTrend.map((t) => t.absent);

  const stats: Stat[] = [
    {
      label: 'Overall Attendance',
      value: pct(overview.attendancePercentage),
      icon: <GraduationCap size={18} />,
      tone: 'blue',
      hint: (
        <span className="flex items-center gap-1">
          <TrendingUp size={11} className="text-[var(--theme-success)]" />
          <span className="text-[var(--theme-success)]">across all sessions</span>
        </span>
      ),
      sparkline: presentTrend,
    },
    {
      label: 'Total Students',
      value: String(overview.studentCount),
      icon: <Users size={18} />,
      tone: 'orange',
      hint: (
        <span className="flex items-center gap-1">
          <Clock size={11} />
          enrolled
        </span>
      ),
    },
    {
      label: 'Classes Conducted',
      value: String(overview.completedSessionCount),
      icon: <CalendarCheck2 size={18} />,
      tone: 'green',
      hint: (
        <span className="flex items-center gap-1">
          <TrendingUp size={11} className="text-[var(--theme-success)]" />
          <span className="text-[var(--theme-success)]">{overview.todayPresent} present today</span>
        </span>
      ),
      sparkline: presentTrend,
    },
    {
      label: 'Assignments',
      value: String(overview.upcomingAssignments),
      icon: <BookOpen size={18} />,
      tone: 'purple',
      hint: (
        <span className="flex items-center gap-1">
          <Clock size={11} />
          upcoming deadlines
        </span>
      ),
    },
    {
      label: 'Notices Published',
      value: String(overview.publishedNotices),
      icon: <Megaphone size={18} />,
      tone: 'orange',
    },
    {
      label: 'Today\'s Attendance',
      value: overview.todayPresent + overview.todayAbsent > 0
        ? `${overview.todayPresent}/${overview.todayPresent + overview.todayAbsent}`
        : '—',
      icon: <GraduationCap size={18} />,
      tone: overview.todayPresent >= overview.todayAbsent ? 'green' : 'red',
      hint: (
        <span className="flex items-center gap-1">
          {overview.todayPresent >= overview.todayAbsent ? (
            <TrendingUp size={11} className="text-[var(--theme-success)]" />
          ) : (
            <TrendingDown size={11} className="text-[var(--theme-danger)]" />
          )}
          <span className={overview.todayPresent >= overview.todayAbsent ? 'text-[var(--theme-success)]' : 'text-[var(--theme-danger)]'}>
            {overview.todayPresent + overview.todayAbsent > 0
              ? `${((overview.todayPresent / (overview.todayPresent + overview.todayAbsent)) * 100).toFixed(0)}% today`
              : 'no sessions yet'}
          </span>
        </span>
      ),
      sparkline: absentTrend,
    },
  ];

  const staggerContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reducedMotion ? 0 : 0.05 } },
  };

  const staggerItem: Variants = {
    hidden: reducedMotion ? {} : { opacity: 0, y: 14, scale: 0.97 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: reducedMotion ? 0 : 0.35, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6"
    >
      {stats.map((stat) => {
        const style = toneStyles[stat.tone];
        return (
          <motion.div
            key={stat.label}
            variants={staggerItem}
            className="group relative overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-[var(--theme-card-shadow)] transition-all hover:border-[var(--theme-primary)]/20 sm:p-5"
          >
            <div className="flex items-start justify-between">
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${style.bg} ${style.text}`}
              >
                {stat.icon}
              </span>
              {stat.sparkline && (
                <Sparkline data={stat.sparkline} color={style.sparkline} />
              )}
            </div>
            <div className="mt-3">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--theme-muted)]">
                {stat.label}
              </div>
              <div
                className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                {stat.value}
              </div>
              {stat.hint && (
                <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[var(--theme-muted)]">
                  {stat.hint}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
