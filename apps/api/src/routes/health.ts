import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ data: { status: 'ok', database: 'up' } });
  } catch {
    res.status(503).json({ data: { status: 'degraded', database: 'down' } });
  }
});

export const healthRouter = router;
