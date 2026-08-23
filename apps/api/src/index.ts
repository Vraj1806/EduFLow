import { createApp } from './app.js';
import { getConfig } from './config.js';
import { loadEnvFile } from './loadEnv.js';
import { startNotificationWorker, stopNotificationWorker } from './services/notificationWorker.js';

loadEnvFile();

const cfg = getConfig();
const app = createApp();

const server = app.listen(cfg.PORT, () => {
  console.log(`[api] EduFlow API listening on http://localhost:${cfg.PORT}`);
  // Local-dev / long-lived-process only. The Vercel serverless entrypoint
  // (api/index.ts) never starts the worker — see services/notificationWorker.ts
  // for production placement.
  startNotificationWorker();
});

function shutdown() {
  stopNotificationWorker();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
