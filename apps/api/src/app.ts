import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getConfig } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { dashboardRouter } from './routes/dashboard.js';
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
  const cfg = getConfig();
  const app = express();

  // Security headers. CSP is intentionally permissive about inline scripts so
  // the theme pre-paint script (public/theme-init.js in dev, inlined into the
  // production HTML) keeps working without nonces.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: null,
        },
      },
    }),
  );

  app.use(
    express.json({
      limit: cfg.MAX_BODY_SIZE, // Increased for face image uploads
    }),
  );
  app.use(cookieParser());

  // Coarse DoS protection for the whole API. Auth endpoints get a tighter,
  // dedicated limiter in routes/auth.ts.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 500,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skip: () => getConfig().NODE_ENV === 'test',
    }),
  );

  // Locally-stored profile photos.
  if (cfg.STORAGE_PROVIDER === 'local') {
    app.use(cfg.STORAGE_BASE_URL, express.static(cfg.STORAGE_DIR));
  }

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
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/ai', aiRouter);

  // 404 for unknown routes, then centralized error handling.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
