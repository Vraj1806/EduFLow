import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import * as facultyService from '../services/faculty.service.js';
import * as authService from '../services/auth.service.js';

const router = Router();
router.use(requireAuth);

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

// GET /faculty/me - Current faculty profile
router.get('/me', async (req, res) => {
  const user = await authService.getUserById(req.user!.id);
  if (!user) {
    throw new Error('Account no longer exists');
  }
  res.json({ data: { user } });
});

// PUT /faculty/me - Update name/email
router.put('/me', async (req, res) => {
  const input = updateProfileSchema.parse(req.body);
  const user = await facultyService.updateProfile(req.user!.id, input);
  res.json({ data: { user } });
});

// PUT /faculty/password - Change password
router.put('/password', async (req, res) => {
  const input = changePasswordSchema.parse(req.body);
  await facultyService.changePassword(req.user!.id, input.currentPassword, input.newPassword);
  res.status(204).end();
});

export const facultyRouter = router;
