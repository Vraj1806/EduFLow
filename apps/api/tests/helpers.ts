import request from 'supertest';
import { vi } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

export const app = createApp();

/** A deterministic 512-dim vector used for all mocked ML embeddings. */
export const MOCK_EMBEDDING: number[] = Array.from(
  { length: 512 },
  (_, i) => Math.cos(i * 0.001)
);

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

/**
 * Stub global.fetch with a deterministic ML sidecar. `/embed` returns the same
 * embedding every time and `/detect-multi` returns `faces` faces all carrying
 * that embedding, so a student registered with the same image is always
 * recognized. Call `unstubMLService()` in afterEach to restore fetch.
 */
export function mockMLService(options: { faces?: number } = {}) {
  const faces = options.faces ?? 1;
  const boundingBox = { x: 10, y: 20, width: 60, height: 60 };
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith('/health')) {
      return jsonResponse({
        status: 'ok',
        backend: 'demo',
        models: ['face_detection', 'face_embedding'],
        modelVersion: 'demo-v1.0',
        embeddingDim: 512,
        device: 'demo',
        loaded: true,
      });
    }
    if (url.endsWith('/detect')) {
      return jsonResponse({ detected: true, faceCount: faces, confidence: 0.95, boundingBox });
    }
    if (url.endsWith('/embed')) {
      return jsonResponse({ embedding: MOCK_EMBEDDING, modelVersion: 'demo-v1.0', confidence: 0.95 });
    }
    if (url.endsWith('/detect-multi')) {
      return jsonResponse({
        faces: Array.from({ length: faces }, (_, i) => ({
          faceIndex: i,
          confidence: 0.95,
          boundingBox,
          embedding: MOCK_EMBEDDING,
        })),
      });
    }
    return jsonResponse({ detail: 'not found' }, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Restore global.fetch after tests that used `mockMLService()`. */
export function unstubMLService() {
  vi.unstubAllGlobals();
}

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
  await prisma.refreshToken.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.faceProfile.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
}
