import { Router } from 'express';
import { prisma } from '../db.js';
import * as mlClient from '../services/ml.client.js';

const router = Router();

router.get('/', async (_req, res) => {
  let databaseUp = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseUp = false;
  }

  const ml = mlClient.getMLStatus();
  if (ml.enabled) {
    try {
      const health = await mlClient.health();
      ml.status = health.status;
      ml.backend = health.backend;
      ml.modelVersion = health.modelVersion;
    } catch {
      ml.status = 'degraded';
    }
  }

  const status = databaseUp ? 'ok' : 'degraded';
  res
    .status(databaseUp ? 200 : 503)
    .json({ data: { status, database: databaseUp ? 'up' : 'down', ml } });
});

export const healthRouter = router;
