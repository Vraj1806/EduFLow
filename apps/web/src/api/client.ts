import type { ApiErrorBody } from '@eduflow/shared';

const API_BASE = '/api';

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }
  const body = (await res.json().catch(() => null)) as (ApiErrorBody & { data?: T }) | null;
  if (!res.ok) {
    const error = body?.error ?? { code: 'UNKNOWN', message: `Request failed with status ${res.status}` };
    throw new ApiClientError(res.status, error.code, error.message);
  }
  return (body as { data: T }).data;
}

let refreshInFlight: Promise<boolean> | null = null;

/** Single-flight refresh: concurrent 401s share one refresh call. */
function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((res) => res.ok)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/**
 * Fetch wrapper: sends cookies, parses the `{ data }` envelope, and transparently
 * refreshes a single time when the access token has expired.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const doFetch = (): Promise<Response> =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });

  let res = await doFetch();

  if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    if (await refreshAccessToken()) {
      res = await doFetch();
    }
  }

  return parseResponse<T>(res);
}
