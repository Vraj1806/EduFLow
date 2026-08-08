import type {
  AttendanceSession,
  ClassroomRecognitionResult,
  CreateAttendanceSessionInput,
  PaginationMeta,
  RecognizedStudentInput,
} from '@eduflow/shared';
import { apiFetch, apiFetchWithMeta } from './client.ts';

export async function getSessions(
  page = 1,
  pageSize = 25,
): Promise<{ sessions: AttendanceSession[]; meta: PaginationMeta }> {
  const { data, meta } = await apiFetchWithMeta<{ sessions: AttendanceSession[] }>(
    `/attendance/sessions?page=${page}&pageSize=${pageSize}`,
  );
  return { sessions: data.sessions, meta };
}

export async function getSessionById(id: string): Promise<{ session: AttendanceSession }> {
  return apiFetch(`/attendance/sessions/${id}`);
}

export async function createSession(
  input: CreateAttendanceSessionInput,
): Promise<{ session: AttendanceSession }> {
  return apiFetch('/attendance/sessions', { method: 'POST', body: JSON.stringify(input) });
}

export async function processSession(
  id: string,
  recognizedStudents: RecognizedStudentInput[],
): Promise<{ session: AttendanceSession }> {
  return apiFetch(`/attendance/sessions/${id}/process`, {
    method: 'POST',
    body: JSON.stringify({ recognizedStudents }),
  });
}

export async function confirmSession(id: string): Promise<{ session: AttendanceSession }> {
  return apiFetch(`/attendance/sessions/${id}/confirm`, { method: 'POST' });
}

export async function recognizeClassroom(
  imageBase64: string,
  classId: string,
  division: string,
): Promise<ClassroomRecognitionResult> {
  return apiFetch('/attendance/recognize', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, classId, division }),
  });
}

export async function updateRecord(
  sessionId: string,
  studentId: string,
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED',
): Promise<{ record: { id: string; status: string } }> {
  return apiFetch(`/attendance/sessions/${sessionId}/records/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}
