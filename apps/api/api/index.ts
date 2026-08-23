/**
 * Vercel serverless entrypoint.
 *
 * Exports the Express app directly — @vercel/node wraps it into a Lambda
 * handler, so every request (rewritten here from /api/*) flows through the
 * same middleware chain as local development.
 *
 * Deliberately different from src/index.ts:
 *   - no app.listen()        (serverless provides the HTTP surface)
 *   - no notification worker (setInterval timers are killed between
 *     invocations; see services/notificationWorker.ts for where it runs)
 *
 * The app instance is created once per lambda instance and reused across
 * warm invocations; PrismaClient is likewise cached globally (src/db.ts).
 */
import { createApp } from '../src/app.js';
import { loadEnvFile } from '../src/loadEnv.js';

loadEnvFile();

const app = createApp();

export default app;
