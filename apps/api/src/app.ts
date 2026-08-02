import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { aiRouter } from './routes/ai.js';
import { analyticsRouter } from './routes/analytics.js';
import { assignmentRouter } from './routes/assignments.js';
import { attendanceRouter } from './routes/attendance.js';
import { authRouter } from './routes/auth.js';
import { faceRouter } from './routes/face.js';
import { facultyRouter } from './routes/faculty.js';
import { healthRouter } from './routes/health.js';
import { noticeRouter } from './routes/notices.js';
import { notificationRouter } from './routes/notifications.js';
import { reportRouter } from './routes/reports.js';
import { studentRouter } from './routes/students.js';

/**
 * Express app factory. Kept separate from the entrypoint so tests can build the
 * app with their own environment without starting a listener.
 */
export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '10mb' })); // Increased for face image uploads
  app.use(cookieParser());

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/faculty', facultyRouter);
  app.use('/api/students', studentRouter);
  app.use('/api/students', faceRouter);
  app.use('/api/attendance', attendanceRouter);
  app.use('/api/assignments', assignmentRouter);
  app.use('/api/notices', noticeRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/ai', aiRouter);

  // 404 for unknown routes, then centralized error handling.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
