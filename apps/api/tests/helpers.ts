import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

export const app = createApp();

/** Extract the value of one cookie from a Set-Cookie header array. */
export function cookieValue(setCookie: string[], name: string): string {
  const header = setCookie.find((c) => c.startsWith(`${name}=`));
  if (!header) throw new Error(`Expected cookie ${name} to be set`);
  return header.split(';')[0] ?? '';
}

export interface TestSession {
  user: { id: string; email: string; name: string; role: string; createdAt: string };
  accessToken: string;
  refreshToken: string;
}

/** Register a fresh FACULTY account and capture the session cookies. */
export async function registerFaculty(
  email = 'faculty@test.com',
  password = 'password123',
  name = 'Test Faculty'
): Promise<TestSession> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password })
    .expect(201);

  const cookies = res.headers['set-cookie'] as unknown as string[];
  return {
    user: res.body.data.user as TestSession['user'],
    accessToken: cookieValue(cookies, 'access_token'),
    refreshToken: cookieValue(cookies, 'refresh_token'),
  };
}

export interface StudentPayload {
  studentId: string;
  rollNumber: string;
  name: string;
  email: string;
  class: string;
  division: string;
  semester: string;
  department: string;
}

export function studentPayload(overrides: Partial<StudentPayload> = {}): StudentPayload {
  return {
    studentId: '2025CS001',
    rollNumber: '01',
    name: 'Alice Wonder',
    email: 'alice@test.com',
    class: 'CS',
    division: 'A',
    semester: '3',
    department: 'Computer Science',
    ...overrides,
  };
}

/** Create a student through the API and return the created student row. */
export async function createStudentViaApi(
  session: TestSession,
  overrides: Partial<StudentPayload> = {}
) {
  const res = await request(app)
    .post('/api/students')
    .set('Cookie', session.accessToken)
    .send(studentPayload(overrides))
    .expect(201);
  return res.body.data.student as {
    id: string;
    studentId: string;
    name: string;
    class: string;
    division: string;
  };
}

/** A tiny but structurally valid data-URI that passes image validation. */
export const VALID_IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

/** Wipe all tables in FK-safe order so every test starts clean. */
export async function resetDb() {
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.faceProfile.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
}
