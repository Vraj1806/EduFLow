import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import * as reportService from '../services/report.service.js';
import {
  attendanceReportToCsv,
  attendanceReportToPdf,
} from '../services/reportExport.service.js';

const router = Router();
router.use(requireAuth);

const exportFormatSchema = z.enum(['csv', 'pdf']);

interface ReportQuery {
  classId?: string;
  division?: string;
  startDate?: Date;
  endDate?: Date;
}

function parseQuery(query: Record<string, unknown>): ReportQuery {
  return {
    classId: typeof query.classId === 'string' && query.classId.length > 0 ? query.classId : undefined,
    division: typeof query.division === 'string' && query.division.length > 0 ? query.division : undefined,
    startDate: typeof query.startDate === 'string' ? new Date(query.startDate) : undefined,
    endDate: typeof query.endDate === 'string' ? new Date(query.endDate) : undefined,
  };
}

async function buildReport(req: { user?: { id: string } }, query: ReportQuery) {
  return reportService.getAttendanceReport(req.user!.id, query);
}

function exportFilename(format: 'csv' | 'pdf'): string {
  const date = new Date().toISOString().slice(0, 10);
  return `attendance-report-${date}.${format}`;
}

// GET /reports/attendance?classId&division&startDate&endDate
router.get('/attendance', async (req, res) => {
  const report = await buildReport(req, parseQuery(req.query as Record<string, unknown>));

  res.json({
    data: {
      report,
      export: {
        available: true,
        formats: ['PDF', 'CSV'],
        note: 'Download the report as PDF or CSV via /reports/attendance/export?format=pdf|csv.',
      },
    },
  });
});

// GET /reports/attendance/export?format=csv|pdf&classId&division&startDate&endDate
router.get('/attendance/export', async (req, res) => {
  const format = exportFormatSchema.parse(req.query.format);
  const report = await buildReport(req, parseQuery(req.query as Record<string, unknown>));

  if (format === 'csv') {
    const csv = attendanceReportToCsv(report);
    res
      .status(200)
      .set('Content-Type', 'text/csv; charset=utf-8')
      .set('Content-Disposition', `attachment; filename="${exportFilename('csv')}"`)
      .send(csv);
    return;
  }

  const pdf = await attendanceReportToPdf(report);
  res
    .status(200)
    .set('Content-Type', 'application/pdf')
    .set('Content-Disposition', `attachment; filename="${exportFilename('pdf')}"`)
    .send(pdf);
});

export const reportRouter = router;
