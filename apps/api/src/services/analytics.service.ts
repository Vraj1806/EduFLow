import { prisma } from '../db.js';

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getOverview(facultyId: string) {
  const [students, sessions, upcomingAssignments, publishedNotices, pendingNotifications] =
    await Promise.all([
      prisma.student.count({ where: { facultyId } }),
      prisma.attendanceSession.findMany({
        where: { facultyId },
        include: { records: true },
        orderBy: { date: 'desc' },
      }),
      prisma.assignment.count({
        where: { facultyId, deadline: { gte: new Date() } },
      }),
      prisma.notice.count({ where: { facultyId, publishedAt: { not: null } } }),
      prisma.notification.count({ where: { recipient: facultyId, status: 'PENDING' } }),
    ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayKey = toLocalDateKey(today);
  let todayPresent = 0;
  let todayAbsent = 0;

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  let totalPresent = 0;
  let totalAbsent = 0;

  for (const session of sessions) {
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

  return {
    studentCount: students,
    sessionCount: sessions.length,
    completedSessionCount: completedSessions.length,
    todayPresent,
    todayAbsent,
    attendancePercentage:
      totalPresent + totalAbsent > 0 ? (totalPresent / (totalPresent + totalAbsent)) * 100 : null,
    upcomingAssignments,
    publishedNotices,
    pendingNotifications,
  };
}

export async function getAttendanceTrend(facultyId: string, days: number) {
  const safeDays = Math.min(Math.max(days, 1), 60);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (safeDays - 1));

  const sessions = await prisma.attendanceSession.findMany({
    where: {
      facultyId,
      status: 'COMPLETED',
      date: { gte: start },
    },
    include: { records: true },
    orderBy: { date: 'asc' },
  });

  const dayMap = new Map<string, { present: number; absent: number }>();
  for (let i = 0; i < safeDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dayMap.set(toLocalDateKey(d), { present: 0, absent: 0 });
  }

  for (const session of sessions) {
    const key = toLocalDateKey(session.date);
    const entry = dayMap.get(key);
    if (!entry) continue;
    for (const record of session.records) {
      if (record.status === 'PRESENT') entry.present++;
      else if (record.status === 'ABSENT') entry.absent++;
    }
  }

  return Array.from(dayMap, ([date, counts]) => ({
    date,
    present: counts.present,
    absent: counts.absent,
    total: counts.present + counts.absent,
  }));
}

export async function getClassStats(facultyId: string) {
  const sessions = await prisma.attendanceSession.findMany({
    where: { facultyId, status: 'COMPLETED' },
    include: { records: true },
  });

  const classMap = new Map<
    string,
    { class: string; division: string; sessions: number; present: number; absent: number }
  >();

  for (const session of sessions) {
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

  return Array.from(classMap.values(), (stat) => ({
    ...stat,
    percentage:
      stat.present + stat.absent > 0 ? (stat.present / (stat.present + stat.absent)) * 100 : 0,
  })).sort((a, b) => a.class.localeCompare(b.class) || a.division.localeCompare(b.division));
}
