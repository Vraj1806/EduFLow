import type { AttendanceReport, ReportExportMeta } from '@eduflow/shared';
import { apiFetch } from './client.ts';

export interface ReportFilters {
  classId?: string;
  division?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAttendanceReport(
  filters: ReportFilters = {},
): Promise<{ report: AttendanceReport; export: ReportExportMeta }> {
  const qs = toQueryString(filters);
  return apiFetch(`/reports/attendance${qs ? `?${qs}` : ''}`);
}

export type ReportFormat = 'csv' | 'pdf';

/** Same-origin URL for the report download (cookies are sent automatically). */
export function getReportExportUrl(filters: ReportFilters, format: ReportFormat): string {
  const qs = toQueryString(filters);
  return `/api/reports/attendance/export?format=${format}${qs ? `&${qs}` : ''}`;
}

function toQueryString(filters: ReportFilters): string {
  const params = new URLSearchParams();
  if (filters.classId) params.set('classId', filters.classId);
  if (filters.division) params.set('division', filters.division);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  return params.toString();
}
