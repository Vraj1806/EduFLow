import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import * as faceService from '../services/face.service.js';

const router = Router();

// All face routes require authentication
router.use(requireAuth);

const registerFaceSchema = z.object({
  imageBase64: z.string().min(1, 'Image data is required'),
});

// POST /students/:studentId/face - Register or update face profile
router.post('/:studentId/face', async (req, res) => {
  const { studentId } = req.params;
  const { imageBase64 } = registerFaceSchema.parse(req.body);

  const faceProfile = await faceService.registerFaceProfile(studentId, imageBase64, req.user!.id);
  res.status(201).json({ data: { faceProfile } });
});

// GET /students/:studentId/face/status - Get face registration status
router.get('/:studentId/face/status', async (req, res) => {
  const { studentId } = req.params;
  const status = await faceService.getFaceProfileStatus(studentId, req.user!.id);
  res.json({ data: status });
});

// DELETE /students/:studentId/face - Delete face profile
router.delete('/:studentId/face', async (req, res) => {
  const { studentId } = req.params;
  await faceService.deleteFaceProfile(studentId, req.user!.id);
  res.status(204).end();
});

export const faceRouter = router;
