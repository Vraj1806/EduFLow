import type { FaceProfileStatus } from '@eduflow/shared';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(body.error?.message || 'Request failed');
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const json = await res.json();
  return json.data;
}

export async function registerFace(
  studentId: string,
  imageBase64: string,
): Promise<{ faceProfile: { id: string; studentId: string; modelVersion: string } }> {
  const res = await fetch(`/api/students/${studentId}/face`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ imageBase64 }),
  });
  return handleResponse(res);
}

export async function getFaceStatus(studentId: string): Promise<FaceProfileStatus> {
  const res = await fetch(`/api/students/${studentId}/face/status`, {
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function deleteFaceProfile(studentId: string): Promise<void> {
  const res = await fetch(`/api/students/${studentId}/face`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res);
}
