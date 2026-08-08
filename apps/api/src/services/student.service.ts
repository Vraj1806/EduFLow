import { prisma } from '../db.js';
import { AppError } from '../middleware/error.js';
import type { PaginationOptions } from '../lib/pagination.js';
import { deleteStoredImage, keyFromUrl, storeProfilePhoto } from './storage.service.js';

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

export async function getAllStudents(facultyId: string, pagination: PaginationOptions) {
  const where = { facultyId };
  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: [{ class: 'asc' }, { rollNumber: 'asc' }],
      include: studentInclude,
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
  ]);
  return { students, total };
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

  const { profilePhoto, ...data } = input;
  const storedPhoto = profilePhoto ? await storeProfilePhoto(profilePhoto) : undefined;

  return prisma.student.create({
    data: { ...data, profilePhoto: storedPhoto?.url },
    include: studentInclude,
  });
}

export async function updateStudent(id: string, input: UpdateStudentInput, facultyId: string) {
  // Verify student exists and belongs to the faculty
  const existing = await getStudentById(id, facultyId);

  // If email is being updated, check it's not taken
  if (input.email) {
    const existingByEmail = await prisma.student.findFirst({
      where: { email: input.email, NOT: { id } },
    });
    if (existingByEmail) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Email already exists');
    }
  }

  const { profilePhoto, ...data } = input;
  const storedPhoto = profilePhoto ? await storeProfilePhoto(profilePhoto) : undefined;

  const updated = await prisma.student.update({
    where: { id },
    data: storedPhoto ? { ...data, profilePhoto: storedPhoto.url } : data,
    include: studentInclude,
  });

  // Replace the previous stored object once the new photo is committed.
  if (storedPhoto && existing.profilePhoto) {
    await deleteStoredImage(keyFromUrl(existing.profilePhoto)).catch(() => undefined);
  }

  return updated;
}

export async function deleteStudent(id: string, facultyId: string) {
  // Verify student exists and belongs to the faculty
  const student = await getStudentById(id, facultyId);

  // Cascade will automatically delete face profile
  await prisma.student.delete({ where: { id } });

  if (student.profilePhoto) {
    await deleteStoredImage(keyFromUrl(student.profilePhoto)).catch(() => undefined);
  }
}

export async function searchStudents(query: string, facultyId: string, pagination: PaginationOptions) {
  const searchTerm = query.trim().toLowerCase();
  const where = {
    facultyId,
    OR: [
      { name: { contains: searchTerm } },
      { studentId: { contains: searchTerm } },
      { rollNumber: { contains: searchTerm } },
      { email: { contains: searchTerm } },
      { class: { contains: searchTerm } },
      { division: { contains: searchTerm } },
    ],
  };

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: [{ class: 'asc' }, { rollNumber: 'asc' }],
      include: studentInclude,
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
  ]);
  return { students, total };
}
