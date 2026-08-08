import type { Assignment, CreateAssignmentInput, PaginationMeta, UpdateAssignmentInput } from '@eduflow/shared';
import { apiFetch, apiFetchWithMeta } from './client.ts';

export async function getAssignments(
  page = 1,
  pageSize = 25,
): Promise<{ assignments: Assignment[]; meta: PaginationMeta }> {
  const { data, meta } = await apiFetchWithMeta<{ assignments: Assignment[] }>(
    `/assignments?page=${page}&pageSize=${pageSize}`,
  );
  return { assignments: data.assignments, meta };
}

export async function getUpcomingAssignments(): Promise<{ assignments: Assignment[] }> {
  return apiFetch('/assignments/upcoming');
}

export async function getAssignmentById(id: string): Promise<{ assignment: Assignment }> {
  return apiFetch(`/assignments/${id}`);
}

export async function createAssignment(
  input: CreateAssignmentInput,
): Promise<{ assignment: Assignment }> {
  return apiFetch('/assignments', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateAssignment(
  id: string,
  input: UpdateAssignmentInput,
): Promise<{ assignment: Assignment }> {
  return apiFetch(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function deleteAssignment(id: string): Promise<void> {
  return apiFetch(`/assignments/${id}`, { method: 'DELETE' });
}
