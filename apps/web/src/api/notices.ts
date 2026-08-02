import type { CreateNoticeInput, Notice, UpdateNoticeInput } from '@eduflow/shared';
import { apiFetch } from './client.ts';

export async function getNotices(): Promise<{ notices: Notice[] }> {
  return apiFetch('/notices');
}

export async function getPublishedNotices(): Promise<{ notices: Notice[] }> {
  return apiFetch('/notices/published');
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
