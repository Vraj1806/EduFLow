import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import * as noticeService from '../services/notice.service.js';

const router = Router();
router.use(requireAuth);

const createNoticeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  targetClass: z.string().optional(),
  targetDiv: z.string().optional(),
});

const updateNoticeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  targetClass: z.string().optional(),
  targetDiv: z.string().optional(),
});

router.post('/', async (req, res) => {
  const input = createNoticeSchema.parse(req.body);
  const notice = await noticeService.createNotice({
    ...input,
    facultyId: req.user!.id,
  });
  res.status(201).json({ data: { notice } });
});

router.get('/', async (req, res) => {
  const notices = await noticeService.getNotices(req.user!.id);
  res.json({ data: { notices } });
});

router.get('/published', async (req, res) => {
  const notices = await noticeService.getPublishedNotices(req.user!.id);
  res.json({ data: { notices } });
});

router.get('/:id', async (req, res) => {
  const notice = await noticeService.getNoticeById(req.params.id, req.user!.id);
  res.json({ data: { notice } });
});

router.put('/:id', async (req, res) => {
  const input = updateNoticeSchema.parse(req.body);
  const notice = await noticeService.updateNotice(req.params.id, input, req.user!.id);
  res.json({ data: { notice } });
});

router.post('/:id/publish', async (req, res) => {
  const notice = await noticeService.publishNotice(req.params.id, req.user!.id);
  res.json({ data: { notice } });
});

router.delete('/:id', async (req, res) => {
  await noticeService.deleteNotice(req.params.id, req.user!.id);
  res.status(204).end();
});

export const noticeRouter = router;
