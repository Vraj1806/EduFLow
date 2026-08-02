import type { Student, CreateStudentInput, UpdateStudentInput } from '@eduflow/shared';

const API_BASE = '/api/students';

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

export async function getAllStudents(): Promise<{ students: Student[] }> {
  const res = await fetch(API_BASE, {
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function searchStudents(query: string): Promise<{ students: Student[] }> {
  const res = await fetch(`${API_BASE}?q=${encodeURIComponent(query)}`, {
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function getStudentById(id: string): Promise<{ student: Student }> {
  const res = await fetch(`${API_BASE}/${id}`, {
    credentials: 'include',
  });
  return handleResponse(res);
}

export async function createStudent(input: CreateStudentInput): Promise<{ student: Student }> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function updateStudent(
  id: string,
  input: UpdateStudentInput,
): Promise<{ student: Student }> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function deleteStudent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res);
}
