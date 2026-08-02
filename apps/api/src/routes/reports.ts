import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as reportService from '../services/report.service.js';

const router = Router();
router.use(requireAuth);

// GET /reports/attendance?classId&division&startDate&endDate
router.get('/attendance', async (req, res) => {
  const { classId, division, startDate, endDate } = req.query;

  const report = await reportService.getAttendanceReport(req.user!.id, {
    classId: typeof classId === 'string' && classId.length > 0 ? classId : undefined,
    division: typeof division === 'string' && division.length > 0 ? division : undefined,
    startDate: typeof startDate === 'string' ? new Date(startDate) : undefined,
    endDate: typeof endDate === 'string' ? new Date(endDate) : undefined,
  });

  res.json({
    data: {
      report,
      export: {
        available: false,
        formats: ['PDF', 'CSV'],
        note: 'Export generation is not implemented yet. The report data is returned here for a future export service (PDF/CSV).',
      },
    },
  });
});

export const reportRouter = router;
