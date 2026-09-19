import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import type { PaginationOptions } from '../lib/pagination.js';
import { AppError } from '../middleware/error.js';
import { createNotification } from './notification.service.js';

export interface CreateAttendanceSessionInput {
  facultyId: string;
  classId: string;
  division: string;
  date: Date;
  imageReference?: string;
}

export interface ProcessAttendanceInput {
  sessionId: string;
  facultyId: string;
  recognizedStudents: Array<{
    studentId: string;
    confidence: number;
  }>;
}

const sessionInclude = {
  records: {
    include: {
      student: {
        select: {
          id: true,
          name: true,
          rollNumber: true,
          studentId: true,
          email: true,
        },
      },
    },
  },
} as const;

/**
 * Queue one ABSENCE notification for a student, addressed to the student email.
 *
 * The `dedupeKey` ties the notification to a specific attendance event
 * (session + student + ABSENCE) so re-running the same flow can never queue a
 * second email for the same absence. Delivery itself is handled later by the
 * SMTP worker — enqueueing only touches the database, so SMTP configuration
 * cannot make attendance marking fail.
 */
export async function enqueueAbsenceNotification(
  session: { id: string; classId: string; division: string; date: Date },
  student: { name: string; rollNumber?: string; email: string },
  senderId?: string
) {
  const dateLabel = session.date.toISOString().slice(0, 10);
  const roll = student.rollNumber ? ` (${student.rollNumber})` : '';

  await createNotification({
    type: 'ABSENCE',
    title: 'Absence recorded',
    message: `${student.name}${roll} was marked ABSENT for ${session.classId} ${session.division} on ${dateLabel}.`,
    recipient: student.email,
    senderId,
    dedupeKey: `absence:${session.id}:${student.email}`,
  });
}

export async function createAttendanceSession(input: CreateAttendanceSessionInput) {
  return prisma.attendanceSession.create({
    data: {
      facultyId: input.facultyId,
      classId: input.classId,
      division: input.division,
      date: input.date,
      imageReference: input.imageReference,
      status: 'DRAFT',
    },
  });
}

export async function getAttendanceSessions(facultyId: string, pagination: PaginationOptions) {
  const where = { facultyId };
  const [total, sessions] = await Promise.all([
    prisma.attendanceSession.count({ where }),
    prisma.attendanceSession.findMany({
      where,
      include: sessionInclude,
      orderBy: { date: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
  ]);
  return { sessions, total };
}

export async function getAttendanceSessionById(id: string, facultyId: string) {
  const session = await prisma.attendanceSession.findFirst({
    where: { id, facultyId },
    include: sessionInclude,
  });

  if (!session) {
    throw new AppError(404, 'SESSION_NOT_FOUND', 'Attendance session not found');
  }

  return session;
}

export async function processAttendance(input: ProcessAttendanceInput) {
  const session = await getAttendanceSessionById(input.sessionId, input.facultyId);

  if (session.status !== 'DRAFT') {
    throw new AppError(400, 'SESSION_NOT_EDITABLE', 'This session cannot be modified');
  }

  // Mark recognized students as present
  for (const recognized of input.recognizedStudents) {
    await prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentId: {
          sessionId: input.sessionId,
          studentId: recognized.studentId,
        },
      },
      create: {
        sessionId: input.sessionId,
        studentId: recognized.studentId,
        status: 'PRESENT',
        confidence: recognized.confidence,
      },
      update: {
        status: 'PRESENT',
        confidence: recognized.confidence,
      },
    });
  }

  // Update session status
  await prisma.attendanceSession.update({
    where: { id: input.sessionId },
    data: { status: 'PROCESSING' },
  });

  return getAttendanceSessionById(input.sessionId, input.facultyId);
}

export async function confirmAttendance(sessionId: string, facultyId: string) {
  const session = await getAttendanceSessionById(sessionId, facultyId);

  if (session.status === 'COMPLETED') {
    throw new AppError(400, 'ALREADY_COMPLETED', 'Attendance already confirmed');
  }

  // Get all students in the class/division owned by this faculty
  const allStudents = await prisma.student.findMany({
    where: {
      facultyId,
      class: session.classId,
      division: session.division,
    },
  });

  const markedStudentIds = session.records.map((r) => r.studentId);

  // Mark unmarked students as absent and notify them via email.
  // enqueueAbsenceNotification uses a dedupeKey keyed on session+student so
  // re-running the same flow can never produce a second notification for the
  // same absence event.
  for (const student of allStudents) {
    if (!markedStudentIds.includes(student.id)) {
      await prisma.attendanceRecord.create({
        data: {
          sessionId,
          studentId: student.id,
          status: 'ABSENT',
        },
      });
      await enqueueAbsenceNotification(session, student, facultyId);
    }
  }

  await prisma.attendanceSession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED' },
  });

  return getAttendanceSessionById(sessionId, facultyId);
}

export async function updateAttendanceRecord(
  sessionId: string,
  studentId: string,
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED',
  facultyId: string
) {
  const session = await getAttendanceSessionById(sessionId, facultyId);

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      sessionId_studentId: { sessionId, studentId },
    },
    select: { status: true },
  });

  const record = await prisma.attendanceRecord.upsert({
    where: {
      sessionId_studentId: { sessionId, studentId },
    },
    create: {
      sessionId,
      studentId,
      status,
    },
    update: {
      status,
    },
  });

  // Notify only on a transition INTO ABSENT. Repeated ABSENT updates, or a
  // correction from ABSENT back to PRESENT/EXCUSED, must not send another email.
  if (status === 'ABSENT' && existing?.status !== 'ABSENT') {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true, rollNumber: true, email: true },
    });
    if (student) {
      await enqueueAbsenceNotification(session, student, facultyId);
    }
  }

  return record;
}

export async function getStudentAttendance(studentId: string, facultyId: string) {
  return prisma.attendanceRecord.findMany({
    where: {
      studentId,
      session: { facultyId },
    },
    include: {
      session: {
        select: {
          id: true,
          classId: true,
          division: true,
          date: true,
          status: true,
        },
      },
    },
    orderBy: { markedAt: 'desc' },
  });
}

export async function getAttendanceStats(
  classId: string,
  division: string,
  facultyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const whereClause: Prisma.AttendanceSessionWhereInput = { classId, division, facultyId };

  if (startDate || endDate) {
    whereClause.date = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  const sessions = await prisma.attendanceSession.findMany({
    where: whereClause,
    include: {
      records: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              rollNumber: true,
            },
          },
        },
      },
    },
  });

  const totalSessions = sessions.length;
  const studentStats: Record<string, { name: string; rollNumber: string; present: number; absent: number }> = {};

  for (const session of sessions) {
    for (const record of session.records) {
      if (!studentStats[record.studentId]) {
        studentStats[record.studentId] = {
          name: record.student.name,
          rollNumber: record.student.rollNumber,
          present: 0,
          absent: 0,
        };
      }

      const stats = studentStats[record.studentId]!;
      if (record.status === 'PRESENT') {
        stats.present++;
      } else if (record.status === 'ABSENT') {
        stats.absent++;
      }
    }
  }

  return {
    totalSessions,
    students: Object.entries(studentStats).map(([id, stats]) => ({
      studentId: id,
      ...stats,
      percentage: totalSessions > 0 ? (stats.present / totalSessions) * 100 : 0,
    })),
  };
}
