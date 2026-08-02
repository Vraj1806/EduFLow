/**
 * @eduflow/shared
 *
 * Types shared between the API and web apps.
 * IMPORTANT: type-only package — never add runtime exports here. Consumers must
 * import with `import type { ... } from '@eduflow/shared'` so the imports are
 * erased at compile time (no runtime resolution required).
 */

export type Role = 'ADMIN' | 'FACULTY';

/** The current faculty/admin user, as returned by the API. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

/** Minimal identity carried on authenticated requests (set by the API middleware). */
export interface RequestUser {
  id: string;
  role: Role;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Standard API error body: `{ error: { code, message } }`. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export type FaceStatus = 'NOT_REGISTERED' | 'REGISTERED';

export interface FaceProfile {
  id: string;
  modelVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  studentId: string;
  rollNumber: string;
  name: string;
  email: string;
  class: string;
  division: string;
  semester: string;
  department: string;
  profilePhoto: string | null;
  faceStatus: FaceStatus;
  createdAt: string;
  updatedAt: string;
  faceProfile?: {
    id: string;
    modelVersion: string;
    createdAt: string;
  } | null;
}

export interface CreateStudentInput {
  studentId: string;
  rollNumber: string;
  name: string;
  email: string;
  class: string;
  division: string;
  semester: string;
  department: string;
  profilePhoto?: string;
}

export interface UpdateStudentInput {
  rollNumber?: string;
  name?: string;
  email?: string;
  class?: string;
  division?: string;
  semester?: string;
  department?: string;
  profilePhoto?: string;
}

export interface FaceProfileStatus {
  studentId: string;
  faceStatus: FaceStatus;
  registered: boolean;
  faceProfile: {
    id: string;
    modelVersion: string;
    registeredAt: string;
    lastUpdated: string;
  } | null;
}

// ---- Attendance ----

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';
export type SessionStatus = 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface AttendanceStudentRef {
  id: string;
  name: string;
  rollNumber: string;
  studentId: string;
  email?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  confidence: number | null;
  markedAt: string;
  student?: AttendanceStudentRef;
}

export interface AttendanceSession {
  id: string;
  facultyId: string;
  classId: string;
  division: string;
  date: string;
  imageReference: string | null;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  records?: AttendanceRecord[];
}

export interface CreateAttendanceSessionInput {
  classId: string;
  division: string;
  date: string;
  imageReference?: string;
}

export interface RecognizedStudentInput {
  studentId: string;
  confidence: number;
}

export interface DetectedFace {
  faceIndex: number;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  embedding?: number[];
}

export interface RecognizedStudent {
  studentId: string;
  studentName: string;
  rollNumber: string;
  confidence: number;
  faceIndex: number;
}

export interface ClassroomRecognitionResult {
  totalFaces: number;
  recognizedStudents: RecognizedStudent[];
  unknownFaces: DetectedFace[];
}

// ---- Assignments ----

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  division: string;
  facultyId: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssignmentInput {
  title: string;
  description: string;
  classId: string;
  division: string;
  deadline: string;
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string;
  deadline?: string;
}

// ---- Notices ----

export interface Notice {
  id: string;
  title: string;
  content: string;
  facultyId: string;
  targetClass: string | null;
  targetDiv: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoticeInput {
  title: string;
  content: string;
  targetClass?: string;
  targetDiv?: string;
}

export interface UpdateNoticeInput {
  title?: string;
  content?: string;
  targetClass?: string;
  targetDiv?: string;
}

// ---- Notifications ----

export type NotificationType = 'ABSENCE' | 'ASSIGNMENT' | 'NOTICE' | 'GENERAL';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipient: string;
  status: NotificationStatus;
  sentAt: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
}

// ---- Analytics ----

export interface AttendanceOverview {
  studentCount: number;
  sessionCount: number;
  completedSessionCount: number;
  todayPresent: number;
  todayAbsent: number;
  attendancePercentage: number | null;
  upcomingAssignments: number;
  publishedNotices: number;
  pendingNotifications: number;
}

export interface AttendanceTrendPoint {
  date: string;
  present: number;
  absent: number;
  total: number;
}

export interface ClassAttendanceStat {
  class: string;
  division: string;
  sessions: number;
  present: number;
  absent: number;
  percentage: number;
}

// ---- Reports ----

export interface AttendanceReportRow {
  sessionId: string;
  date: string;
  studentId: string;
  name: string;
  rollNumber: string;
  status: AttendanceStatus;
  confidence: number | null;
}

export interface AttendanceReportSummary {
  totalStudents: number;
  totalSessions: number;
  present: number;
  absent: number;
  excused: number;
  percentage: number | null;
}

export interface AttendanceReport {
  summary: AttendanceReportSummary;
  rows: AttendanceReportRow[];
}

export interface ReportExportMeta {
  available: boolean;
  formats: string[];
  note: string;
}

// ---- Faculty settings ----

export interface UpdateProfileInput {
  name?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// ---- AI service ----

export type MessageCategory =
  | 'ABSENCE'
  | 'ASSIGNMENT'
  | 'QUESTION'
  | 'REQUEST'
  | 'GENERAL'
  | 'OTHER';

export interface AIClassification {
  category: MessageCategory;
  confidence: number;
  reasoning: string;
}

export interface AIStatus {
  configured: boolean;
  provider: string | null;
  capabilities: string[];
}
