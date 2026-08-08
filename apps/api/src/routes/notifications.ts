import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { parsePagination, paginationMeta } from '../lib/pagination.js';
import * as notificationService from '../services/notification.service.js';

const router = Router();
router.use(requireAuth);

const createNotificationSchema = z.object({
  type: z.enum(['ABSENCE', 'ASSIGNMENT', 'NOTICE', 'GENERAL']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
});

router.get('/', async (req, res) => {
  const pagination = parsePagination(req.query as Record<string, unknown>);
  const { notifications, total } = await notificationService.getNotifications(req.user!.id, pagination);
  const pending = await notificationService.getPendingCount(req.user!.id);
  res.json({
    data: { notifications, pending },
    meta: paginationMeta(pagination.page, pagination.pageSize, total),
  });
});

router.post('/', async (req, res) => {
  const input = createNotificationSchema.parse(req.body);
  const notification = await notificationService.createNotification({
    ...input,
    recipient: req.user!.id,
  });
  res.status(201).json({ data: { notification } });
});

router.post('/:id/sent', async (req, res) => {
  await notificationService.markNotificationSent(req.params.id, req.user!.id);
  res.status(204).end();
});

export const notificationRouter = router;
