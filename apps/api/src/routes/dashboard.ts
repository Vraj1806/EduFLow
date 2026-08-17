import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as dashboardService from '../services/dashboard.service.js';

const router = Router();
router.use(requireAuth);

// GET /dashboard/summary - Aggregated dashboard data
router.get('/summary', async (req, res) => {
  const summary = await dashboardService.getDashboardSummary(req.user!.id);
  res.json({ data: summary });
});

export const dashboardRouter = router;
