import type {
  AttendanceOverview,
  AttendanceTrendPoint,
  ClassAttendanceStat,
} from '@eduflow/shared';
import { apiFetch } from './client.ts';

export async function getOverview(): Promise<AttendanceOverview> {
  return apiFetch('/analytics/overview');
}

export async function getTrend(days = 14): Promise<{ trend: AttendanceTrendPoint[] }> {
  return apiFetch(`/analytics/trend?days=${days}`);
}

export async function getClassStats(): Promise<{ classes: ClassAttendanceStat[] }> {
  return apiFetch('/analytics/classes');
}
