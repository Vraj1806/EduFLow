import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';

export interface AttendanceReportFilters {
  classId?: string;
  division?: string;
  startDate?: Date;
  endDate?: Date;
}

export async function getAttendanceReport(facultyId: string, filters: AttendanceReportFilters) {
  const where: Prisma.AttendanceSessionWhereInput = { facultyId };

  if (filters.classId) where.classId = filters.classId;
  if (filters.division) where.division = filters.division;
  if (filters.startDate || filters.endDate) {
    where.date = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };
  }

  const sessions = await prisma.attendanceSession.findMany({
    where,
    include: {
      records: {
        include: {
          student: {
            select: { id: true, name: true, rollNumber: true },
          },
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  const rows: Array<{
    sessionId: string;
    date: string;
    studentId: string;
    name: string;
    rollNumber: string;
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
    confidence: number | null;
  }> = [];

  const studentIds = new Set<string>();
  let present = 0;
  let absent = 0;
  let excused = 0;

  for (const session of sessions) {
    for (const record of session.records) {
      rows.push({
        sessionId: session.id,
        date: session.date.toISOString(),
        studentId: record.student.id,
        name: record.student.name,
        rollNumber: record.student.rollNumber,
        status: record.status,
        confidence: record.confidence,
      });
      studentIds.add(record.student.id);
      if (record.status === 'PRESENT') present++;
      else if (record.status === 'ABSENT') absent++;
      else excused++;
    }
  }

  return {
    summary: {
      totalStudents: studentIds.size,
      totalSessions: sessions.length,
      present,
      absent,
      excused,
      percentage: present + absent > 0 ? (present / (present + absent)) * 100 : null,
    },
    rows,
  };
}
