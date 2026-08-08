import type { PaginationMeta, Student, CreateStudentInput, UpdateStudentInput } from '@eduflow/shared';

const API_BASE = '/api/students';

interface Envelope<T> {
  data: T;
  meta?: PaginationMeta;
}

async function handleResponse<T>(res: Response): Promise<Envelope<T>> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(body.error?.message || 'Request failed');
  }
  if (res.status === 204) {
    return { data: undefined as T };
  }
  const json = await res.json();
  return { data: json.data as T, meta: json.meta as PaginationMeta | undefined };
}

export async function getAllStudents(
  page = 1,
  pageSize = 25,
): Promise<{ students: Student[]; meta: PaginationMeta }> {
  const res = await fetch(`${API_BASE}?page=${page}&pageSize=${pageSize}`, {
    credentials: 'include',
  });
  const { data, meta } = await handleResponse<{ students: Student[] }>(res);
  return { students: data.students, meta: meta ?? { page: 1, pageSize: 25, total: 0, totalPages: 0 } };
}

export async function searchStudents(
  query: string,
  page = 1,
  pageSize = 25,
): Promise<{ students: Student[]; meta: PaginationMeta }> {
  const params = new URLSearchParams({ q: query, page: String(page), pageSize: String(pageSize) });
  const res = await fetch(`${API_BASE}?${params}`, {
    credentials: 'include',
  });
  const { data, meta } = await handleResponse<{ students: Student[] }>(res);
  return { students: data.students, meta: meta ?? { page: 1, pageSize: 25, total: 0, totalPages: 0 } };
}

export async function getStudentById(id: string): Promise<{ student: Student }> {
  const res = await fetch(`${API_BASE}/${id}`, {
    credentials: 'include',
  });
  const { data } = await handleResponse<{ student: Student }>(res);
  return data;
}

export async function createStudent(input: CreateStudentInput): Promise<{ student: Student }> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const { data } = await handleResponse<{ student: Student }>(res);
  return data;
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
  const { data } = await handleResponse<{ student: Student }>(res);
  return data;
}

export async function deleteStudent(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await handleResponse<void>(res);
}
