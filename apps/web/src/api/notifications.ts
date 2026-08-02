import type { CreateNotificationInput, Notification } from '@eduflow/shared';
import { apiFetch } from './client.ts';

export async function getNotifications(): Promise<{
  notifications: Notification[];
  pending: number;
}> {
  return apiFetch('/notifications');
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<{ notification: Notification }> {
  return apiFetch('/notifications', { method: 'POST', body: JSON.stringify(input) });
}

export async function markNotificationSent(id: string): Promise<void> {
  return apiFetch(`/notifications/${id}/sent`, { method: 'POST' });
}
