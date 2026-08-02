import type { AuthUser, ChangePasswordInput, UpdateProfileInput } from '@eduflow/shared';
import { apiFetch } from './client.ts';

export async function getProfile(): Promise<{ user: AuthUser }> {
  return apiFetch('/faculty/me');
}

export async function updateProfile(input: UpdateProfileInput): Promise<{ user: AuthUser }> {
  return apiFetch('/faculty/me', { method: 'PUT', body: JSON.stringify(input) });
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  return apiFetch('/faculty/password', { method: 'PUT', body: JSON.stringify(input) });
}
