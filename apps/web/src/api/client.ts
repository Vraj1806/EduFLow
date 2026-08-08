import type { ApiErrorBody, PaginationMeta } from '@eduflow/shared';

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

async function fetchEnvelope<T>(path: string, init: RequestInit = {}): Promise<{ data: T; meta?: PaginationMeta }> {
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

  if (res.status === 204) {
    return { data: undefined as T };
  }
  const body = (await res.json().catch(() => null)) as (ApiErrorBody & { data?: T; meta?: PaginationMeta }) | null;
  if (!res.ok) {
    const error = body?.error ?? { code: 'UNKNOWN', message: `Request failed with status ${res.status}` };
    throw new ApiClientError(res.status, error.code, error.message);
  }
  return { data: body?.data as T, meta: body?.meta };
}

/**
 * Fetch wrapper: sends cookies, parses the `{ data }` envelope, and transparently
 * refreshes a single time when the access token has expired.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await fetchEnvelope<T>(path, init);
  return data;
}

/**
 * Like `apiFetch` but also returns the top-level pagination meta when present.
 * Use for paginated list endpoints.
 */
export async function apiFetchWithMeta<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; meta: PaginationMeta }> {
  const { data, meta } = await fetchEnvelope<T>(path, init);
  // If the server did not return meta (non-paginated endpoint), synthesise a
  // reasonable default so callers never have to null-check.
  return {
    data,
    meta: meta ?? { page: 1, pageSize: 25, total: 0, totalPages: 0 },
  };
}
