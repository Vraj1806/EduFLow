import { z } from 'zod';

/**
 * Shared offset-based pagination for list endpoints.
 *
 * Query params are best-effort hints: `page` (>= 1) and `pageSize` (1–100,
 * default 25). Invalid values fall back to the defaults instead of failing the
 * request, so pagination never breaks existing callers.
 */

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginationMeta extends PaginationOptions {
  total: number;
  totalPages: number;
}

export function parsePagination(query: Record<string, unknown>): PaginationOptions {
  const parsed = paginationSchema.safeParse(query);
  return parsed.success
    ? { page: parsed.data.page, pageSize: parsed.data.pageSize }
    : { page: 1, pageSize: 25 };
}

export function paginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
