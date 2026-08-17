import { prisma } from '../db.js';

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getDashboardSummary(facultyId: string) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayKey = toLocalDateKey(today);

  const [
    studentCount,
    allSessions,
    upcomingAssignments,
    publishedNotices,
    pendingNotifications,
    recentNotices,
    allStudents,
  ] = await Promise.all([
    prisma.student.count({ where: { facultyId } }),
    prisma.attendanceSession.findMany({
      where: { facultyId },
      include: { records: true },
      orderBy: { date: 'desc' },
    }),
    prisma.assignment.findMany({
      where: { facultyId, deadline: { gte: now } },
      orderBy: { deadline: 'asc' },
      take: 5,
    }),
    prisma.notice.count({ where: { facultyId, publishedAt: { not: null } } }),
    prisma.notification.count({ where: { recipient: facultyId, status: 'PENDING' } }),
    prisma.notice.findMany({
      where: { facultyId, publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    }),
    prisma.student.findMany({
      where: { facultyId },
      select: { id: true, name: true, rollNumber: true, class: true, division: true },
    }),
  ]);

  const completedSessions = allSessions.filter((s) => s.status === 'COMPLETED');

  let todayPresent = 0;
  let todayAbsent = 0;
  let totalPresent = 0;
  let totalAbsent = 0;

  for (const session of allSessions) {
    if (toLocalDateKey(session.date) === todayKey) {
      for (const record of session.records) {
        if (record.status === 'PRESENT') todayPresent++;
        else if (record.status === 'ABSENT') todayAbsent++;
      }
    }
  }

  for (const session of completedSessions) {
    for (const record of session.records) {
      if (record.status === 'PRESENT') totalPresent++;
      else if (record.status === 'ABSENT') totalAbsent++;
    }
  }

  const attendancePercentage =
    totalPresent + totalAbsent > 0 ? (totalPresent / (totalPresent + totalAbsent)) * 100 : null;

  // Trend (30 days)
  const trendDays = 30;
  const trendStart = new Date(today);
  trendStart.setDate(trendStart.getDate() - (trendDays - 1));

  const trendSessions = allSessions.filter(
    (s) => s.status === 'COMPLETED' && new Date(s.date) >= trendStart,
  );

  const dayMap = new Map<string, { present: number; absent: number }>();
  for (let i = 0; i < trendDays; i++) {
    const d = new Date(trendStart);
    d.setDate(d.getDate() + i);
    dayMap.set(toLocalDateKey(d), { present: 0, absent: 0 });
  }

  for (const session of trendSessions) {
    const key = toLocalDateKey(session.date);
    const entry = dayMap.get(key);
    if (!entry) continue;
    for (const record of session.records) {
      if (record.status === 'PRESENT') entry.present++;
      else if (record.status === 'ABSENT') entry.absent++;
    }
  }

  const trend = Array.from(dayMap, ([date, counts]) => ({
    date,
    present: counts.present,
    absent: counts.absent,
    total: counts.present + counts.absent,
  }));

  // Class stats
  const classMap = new Map<
    string,
    { class: string; division: string; sessions: number; present: number; absent: number }
  >();

  for (const session of completedSessions) {
    const key = `${session.classId}|${session.division}`;
    let stat = classMap.get(key);
    if (!stat) {
      stat = { class: session.classId, division: session.division, sessions: 0, present: 0, absent: 0 };
      classMap.set(key, stat);
    }
    stat.sessions++;
    for (const record of session.records) {
      if (record.status === 'PRESENT') stat.present++;
      else if (record.status === 'ABSENT') stat.absent++;
    }
  }

  const classStats = Array.from(classMap.values(), (stat) => ({
    ...stat,
    percentage:
      stat.present + stat.absent > 0 ? (stat.present / (stat.present + stat.absent)) * 100 : 0,
  })).sort((a, b) => a.class.localeCompare(b.class) || a.division.localeCompare(b.division));

  // Low attendance students (threshold 75%)
  const studentAttendanceMap = new Map<
    string,
    { name: string; rollNumber: string; class: string; division: string; present: number; total: number }
  >();

  for (const session of completedSessions) {
    for (const record of session.records) {
      const studentInfo = allStudents.find((s) => s.id === record.studentId);
      if (!studentInfo) continue;
      let entry = studentAttendanceMap.get(record.studentId);
      if (!entry) {
        entry = {
          name: studentInfo.name,
          rollNumber: studentInfo.rollNumber,
          class: studentInfo.class,
          division: studentInfo.division,
          present: 0,
          total: 0,
        };
        studentAttendanceMap.set(record.studentId, entry);
      }
      entry.total++;
      if (record.status === 'PRESENT') entry.present++;
    }
  }

  const lowAttendanceStudents = Array.from(studentAttendanceMap.entries())
    .map(([studentId, stats]) => ({
      studentId,
      ...stats,
      percentage: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
    }))
    .filter((s) => s.percentage < 75 && s.total > 0)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 10);

  // Activity heatmap (12 months)
  const heatmapDays = 365;
  const heatmapStart = new Date(today);
  heatmapStart.setDate(heatmapStart.getDate() - (heatmapDays - 1));

  const activityMap = new Map<string, number>();
  for (let i = 0; i < heatmapDays; i++) {
    const d = new Date(heatmapStart);
    d.setDate(d.getDate() + i);
    activityMap.set(toLocalDateKey(d), 0);
  }

  for (const session of allSessions) {
    const key = toLocalDateKey(new Date(session.date));
    const current = activityMap.get(key);
    if (current !== undefined) {
      activityMap.set(key, current + 1);
    }
  }

  const activity = Array.from(activityMap, ([date, count]) => ({ date, count }));

  return {
    overview: {
      studentCount,
      sessionCount: allSessions.length,
      completedSessionCount: completedSessions.length,
      todayPresent,
      todayAbsent,
      attendancePercentage,
      upcomingAssignments: upcomingAssignments.length,
      publishedNotices,
      pendingNotifications,
    },
    trend,
    classStats,
    upcomingAssignments,
    recentNotices,
    lowAttendanceStudents,
    activity,
  };
}
