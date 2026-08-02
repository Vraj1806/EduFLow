import { prisma } from '../db.js';
import { AppError } from '../middleware/error.js';

export interface CreateStudentInput {
  studentId: string;
  rollNumber: string;
  name: string;
  email: string;
  class: string;
  division: string;
  semester: string;
  department: string;
  profilePhoto?: string;
  facultyId: string;
}

export interface UpdateStudentInput {
  rollNumber?: string;
  name?: string;
  email?: string;
  class?: string;
  division?: string;
  semester?: string;
  department?: string;
  profilePhoto?: string;
}

const studentInclude = {
  faceProfile: {
    select: { id: true, modelVersion: true, createdAt: true, updatedAt: true },
  },
} as const;

export async function getAllStudents(facultyId: string) {
  return prisma.student.findMany({
    where: { facultyId },
    orderBy: [{ class: 'asc' }, { rollNumber: 'asc' }],
    include: studentInclude,
  });
}

export async function getStudentById(id: string, facultyId: string) {
  const student = await prisma.student.findFirst({
    where: { id, facultyId },
    include: studentInclude,
  });

  if (!student) {
    throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
  }

  return student;
}

export async function createStudent(input: CreateStudentInput) {
  // Check for duplicate studentId
  const existingById = await prisma.student.findUnique({
    where: { studentId: input.studentId },
  });
  if (existingById) {
    throw new AppError(409, 'STUDENT_ID_TAKEN', 'Student ID already exists');
  }

  // Check for duplicate email
  const existingByEmail = await prisma.student.findUnique({
    where: { email: input.email },
  });
  if (existingByEmail) {
    throw new AppError(409, 'EMAIL_TAKEN', 'Email already exists');
  }

  return prisma.student.create({
    data: input,
    include: studentInclude,
  });
}

export async function updateStudent(id: string, input: UpdateStudentInput, facultyId: string) {
  // Verify student exists and belongs to the faculty
  await getStudentById(id, facultyId);

  // If email is being updated, check it's not taken
  if (input.email) {
    const existingByEmail = await prisma.student.findFirst({
      where: { email: input.email, NOT: { id } },
    });
    if (existingByEmail) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Email already exists');
    }
  }

  return prisma.student.update({
    where: { id },
    data: input,
    include: studentInclude,
  });
}

export async function deleteStudent(id: string, facultyId: string) {
  // Verify student exists and belongs to the faculty
  await getStudentById(id, facultyId);

  // Cascade will automatically delete face profile
  await prisma.student.delete({ where: { id } });
}

export async function searchStudents(query: string, facultyId: string) {
  const searchTerm = query.trim().toLowerCase();

  return prisma.student.findMany({
    where: {
      facultyId,
      OR: [
        { name: { contains: searchTerm } },
        { studentId: { contains: searchTerm } },
        { rollNumber: { contains: searchTerm } },
        { email: { contains: searchTerm } },
        { class: { contains: searchTerm } },
        { division: { contains: searchTerm } },
      ],
    },
    orderBy: [{ class: 'asc' }, { rollNumber: 'asc' }],
    include: studentInclude,
  });
}
