import type { CreateNoticeInput, Notice, PaginationMeta, UpdateNoticeInput } from '@eduflow/shared';
import { apiFetch, apiFetchWithMeta } from './client.ts';

export async function getNotices(
  page = 1,
  pageSize = 25,
): Promise<{ notices: Notice[]; meta: PaginationMeta }> {
  const { data, meta } = await apiFetchWithMeta<{ notices: Notice[] }>(
    `/notices?page=${page}&pageSize=${pageSize}`,
  );
  return { notices: data.notices, meta };
}

export async function getPublishedNotices(
  page = 1,
  pageSize = 25,
): Promise<{ notices: Notice[]; meta: PaginationMeta }> {
  const { data, meta } = await apiFetchWithMeta<{ notices: Notice[] }>(
    `/notices/published?page=${page}&pageSize=${pageSize}`,
  );
  return { notices: data.notices, meta };
}

export async function getNoticeById(id: string): Promise<{ notice: Notice }> {
  return apiFetch(`/notices/${id}`);
}

export async function createNotice(input: CreateNoticeInput): Promise<{ notice: Notice }> {
  return apiFetch('/notices', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateNotice(
  id: string,
  input: UpdateNoticeInput,
): Promise<{ notice: Notice }> {
  return apiFetch(`/notices/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export async function publishNotice(id: string): Promise<{ notice: Notice }> {
  return apiFetch(`/notices/${id}/publish`, { method: 'POST' });
}

export async function deleteNotice(id: string): Promise<void> {
  return apiFetch(`/notices/${id}`, { method: 'DELETE' });
}
