import type {
  AttendanceSession,
  ClassroomRecognitionResult,
  CreateAttendanceSessionInput,
  RecognizedStudentInput,
} from '@eduflow/shared';
import { apiFetch } from './client.ts';

export async function getSessions(): Promise<{ sessions: AttendanceSession[] }> {
  return apiFetch('/attendance/sessions');
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
