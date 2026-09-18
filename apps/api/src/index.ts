import { createApp } from './app.js';
import { getConfig } from './config.js';
import { loadEnvFile } from './loadEnv.js';
import { startNotificationWorker, stopNotificationWorker } from './services/notificationWorker.js';
import { getMLStatus, health } from './services/ml.client.js';

loadEnvFile();

const cfg = getConfig();
const app = createApp();

async function checkMLService() {
  const status = getMLStatus();
  if (!status.enabled) {
    console.warn('[ml] ML service DISABLED (ML_ENABLED!=true) — face recognition unavailable.');
    return;
  }
  if (!status.url) {
    console.warn('[ml] ML_SERVICE_URL is missing despite ML_ENABLED=true.');
    return;
  }
  try {
    const report = await health();
    console.log(`[ml] ML service OK — ${report.backend ?? 'unknown'} at ${status.url} (${report.modelVersion})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    console.warn(`[ml] ML service UNREACHABLE at ${status.url}: ${message}`);
  }
}

const server = app.listen(cfg.PORT, () => {
  console.log(`[api] EduFlow API listening on http://localhost:${cfg.PORT}`);
  void checkMLService();
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
