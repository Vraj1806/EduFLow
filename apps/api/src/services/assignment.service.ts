import { prisma } from '../db.js';
import { AppError } from '../middleware/error.js';
import { createNotification } from './notification.service.js';

export interface CreateAssignmentInput {
  title: string;
  description: string;
  classId: string;
  division: string;
  facultyId: string;
  deadline: Date;
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  deadline?: Date;
}

export async function createAssignment(input: CreateAssignmentInput) {
  const assignment = await prisma.assignment.create({
    data: input,
  });

  await createNotification({
    type: 'ASSIGNMENT',
    title: 'Assignment created',
    message: `"${assignment.title}" assigned to ${assignment.classId} ${assignment.division}`,
    recipient: assignment.facultyId,
  });

  return assignment;
}

export async function getAssignments(facultyId: string) {
  return prisma.assignment.findMany({
    where: { facultyId },
    orderBy: { deadline: 'asc' },
  });
}

export async function getAssignmentById(id: string, facultyId: string) {
  const assignment = await prisma.assignment.findFirst({
    where: { id, facultyId },
  });

  if (!assignment) {
    throw new AppError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  return assignment;
}

export async function updateAssignment(id: string, input: UpdateAssignmentInput, facultyId: string) {
  await getAssignmentById(id, facultyId);

  return prisma.assignment.update({
    where: { id },
    data: input,
  });
}

export async function deleteAssignment(id: string, facultyId: string) {
  await getAssignmentById(id, facultyId);
  await prisma.assignment.delete({ where: { id } });
}

export async function getUpcomingAssignments(facultyId: string) {
  return prisma.assignment.findMany({
    where: {
      facultyId,
      deadline: {
        gte: new Date(),
      },
    },
    orderBy: { deadline: 'asc' },
    take: 5,
  });
}
