import { createApp } from './app.js';
import { getConfig } from './config.js';
import { loadEnvFile } from './loadEnv.js';

loadEnvFile();

const cfg = getConfig();
const app = createApp();

const server = app.listen(cfg.PORT, () => {
  console.log(`[api] EduFlow API listening on http://localhost:${cfg.PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
