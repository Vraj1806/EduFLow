import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { classifyMessage, getAIStatus } from '../services/ai.service.js';

const router = Router();
router.use(requireAuth);

const classifySchema = z.object({
  text: z.string().min(1).max(2000),
});

// GET /ai/status - Whether the AI service is configured
router.get('/status', (_req, res) => {
  res.json({ data: getAIStatus() });
});

// POST /ai/classify - Classify a student message
router.post('/classify', async (req, res) => {
  const { text } = classifySchema.parse(req.body);
  const classification = await classifyMessage(text);
  res.json({ data: classification });
});

export const aiRouter = router;
