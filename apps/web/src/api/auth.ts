import type { AuthUser, LoginInput, RegisterInput } from '@eduflow/shared';
import { apiFetch } from './client.ts';

export function register(input: RegisterInput): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
}

export function login(input: LoginInput): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
}

export function logout(): Promise<void> {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me');
}
