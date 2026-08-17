import type {
  Assignment,
  AttendanceOverview,
  AttendanceTrendPoint,
  ClassAttendanceStat,
  Notice,
} from '@eduflow/shared';
import { apiFetch } from './client.ts';

export interface LowAttendanceStudent {
  studentId: string;
  name: string;
  rollNumber: string;
  class: string;
  division: string;
  present: number;
  total: number;
  percentage: number;
}

export interface ActivityDay {
  date: string;
  count: number;
}

export interface DashboardSummary {
  overview: AttendanceOverview;
  trend: AttendanceTrendPoint[];
  classStats: ClassAttendanceStat[];
  upcomingAssignments: Assignment[];
  recentNotices: Notice[];
  lowAttendanceStudents: LowAttendanceStudent[];
  activity: ActivityDay[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch('/dashboard/summary');
}
