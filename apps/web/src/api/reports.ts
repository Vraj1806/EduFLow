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
  const params = new URLSearchParams();
  if (filters.classId) params.set('classId', filters.classId);
  if (filters.division) params.set('division', filters.division);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);

  const qs = params.toString();
  return apiFetch(`/reports/attendance${qs ? `?${qs}` : ''}`);
}
