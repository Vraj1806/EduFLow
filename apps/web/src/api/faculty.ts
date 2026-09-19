import type { AuthUser, ChangePasswordInput, EmailPreference, EmailSettings, UpdateProfileInput } from '@eduflow/shared';
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

export async function getEmailSettings(): Promise<{ settings: EmailSettings }> {
  return apiFetch('/faculty/email-settings');
}

export async function updateEmailSettings(input: {
  emailPreference: EmailPreference;
}): Promise<{ settings: EmailSettings }> {
  return apiFetch('/faculty/email-settings', { method: 'PUT', body: JSON.stringify(input) });
}
