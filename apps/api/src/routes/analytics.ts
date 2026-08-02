import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as analyticsService from '../services/analytics.service.js';

const router = Router();
router.use(requireAuth);

// GET /analytics/overview - Aggregate counts for the dashboard
router.get('/overview', async (req, res) => {
  const overview = await analyticsService.getOverview(req.user!.id);
  res.json({ data: overview });
});

// GET /analytics/trend?days=14 - Daily present/absent totals
router.get('/trend', async (req, res) => {
  const days = Number(req.query.days ?? 14);
  const trend = await analyticsService.getAttendanceTrend(req.user!.id, days);
  res.json({ data: { trend } });
});

// GET /analytics/classes - Attendance stats per class/division
router.get('/classes', async (req, res) => {
  const classes = await analyticsService.getClassStats(req.user!.id);
  res.json({ data: { classes } });
});

export const analyticsRouter = router;
