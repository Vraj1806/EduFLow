import type { CreateNotificationInput, Notification, PaginationMeta } from '@eduflow/shared';
import { apiFetch, apiFetchWithMeta } from './client.ts';

export async function getNotifications(
  page = 1,
  pageSize = 25,
): Promise<{
  notifications: Notification[];
  pending: number;
  meta: PaginationMeta;
}> {
  const { data, meta } = await apiFetchWithMeta<{
    notifications: Notification[];
    pending: number;
  }>(`/notifications?page=${page}&pageSize=${pageSize}`);
  return { notifications: data.notifications, pending: data.pending, meta };
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<{ notification: Notification }> {
  return apiFetch('/notifications', { method: 'POST', body: JSON.stringify(input) });
}

export async function markNotificationSent(id: string): Promise<void> {
  return apiFetch(`/notifications/${id}/sent`, { method: 'POST' });
}
