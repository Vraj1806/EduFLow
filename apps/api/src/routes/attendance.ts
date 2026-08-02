import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import * as attendanceService from '../services/attendance.service.js';
import * as classroomService from '../services/classroom.service.js';

const router = Router();
router.use(requireAuth);

const createSessionSchema = z.object({
  classId: z.string().min(1),
  division: z.string().min(1),
  date: z.coerce.date(),
  imageReference: z.string().optional(),
});

const processAttendanceSchema = z.object({
  recognizedStudents: z.array(z.object({
    studentId: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

const updateRecordSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED']),
});

const recognizeClassroomSchema = z.object({
  imageBase64: z.string().min(1),
  classId: z.string().min(1),
  division: z.string().min(1),
});

// POST /attendance/sessions - Create new attendance session
router.post('/sessions', async (req, res) => {
  const input = createSessionSchema.parse(req.body);
  const session = await attendanceService.createAttendanceSession({
    ...input,
    facultyId: req.user!.id,
  });
  res.status(201).json({ data: { session } });
});

// GET /attendance/sessions - Get all sessions for faculty
router.get('/sessions', async (req, res) => {
  const sessions = await attendanceService.getAttendanceSessions(req.user!.id);
  res.json({ data: { sessions } });
});

// GET /attendance/sessions/:id - Get specific session
router.get('/sessions/:id', async (req, res) => {
  const session = await attendanceService.getAttendanceSessionById(req.params.id, req.user!.id);
  res.json({ data: { session } });
});

// POST /attendance/sessions/:id/process - Process attendance recognition
router.post('/sessions/:id/process', async (req, res) => {
  const { recognizedStudents } = processAttendanceSchema.parse(req.body);
  const session = await attendanceService.processAttendance({
    sessionId: req.params.id,
    facultyId: req.user!.id,
    recognizedStudents,
  });
  res.json({ data: { session } });
});

// POST /attendance/sessions/:id/confirm - Confirm and finalize attendance
router.post('/sessions/:id/confirm', async (req, res) => {
  const session = await attendanceService.confirmAttendance(req.params.id, req.user!.id);
  res.json({ data: { session } });
});

// PUT /attendance/sessions/:sessionId/records/:studentId - Update individual record
router.put('/sessions/:sessionId/records/:studentId', async (req, res) => {
  const { status } = updateRecordSchema.parse(req.body);
  const record = await attendanceService.updateAttendanceRecord(
    req.params.sessionId,
    req.params.studentId,
    status,
    req.user!.id
  );
  res.json({ data: { record } });
});

// POST /attendance/recognize - Recognize students from classroom photo
router.post('/recognize', async (req, res) => {
  const { imageBase64, classId, division } = recognizeClassroomSchema.parse(req.body);
  const result = await classroomService.recognizeClassroom(imageBase64, classId, division, req.user!.id);
  res.json({ data: result });
});

// GET /attendance/stats - Get attendance statistics
router.get('/stats', async (req, res) => {
  const { classId, division, startDate, endDate } = req.query;

  const stats = await attendanceService.getAttendanceStats(
    classId as string,
    division as string,
    req.user!.id,
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  res.json({ data: stats });
});

// GET /attendance/student/:studentId - Get student's attendance history
router.get('/student/:studentId', async (req, res) => {
  const attendance = await attendanceService.getStudentAttendance(req.params.studentId, req.user!.id);
  res.json({ data: { attendance } });
});

export const attendanceRouter = router;
