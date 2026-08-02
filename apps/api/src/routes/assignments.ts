import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import * as assignmentService from '../services/assignment.service.js';

const router = Router();
router.use(requireAuth);

const createAssignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  classId: z.string().min(1),
  division: z.string().min(1),
  deadline: z.coerce.date(),
});

const updateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  deadline: z.coerce.date().optional(),
});

router.post('/', async (req, res) => {
  const input = createAssignmentSchema.parse(req.body);
  const assignment = await assignmentService.createAssignment({
    ...input,
    facultyId: req.user!.id,
  });
  res.status(201).json({ data: { assignment } });
});

router.get('/', async (req, res) => {
  const assignments = await assignmentService.getAssignments(req.user!.id);
  res.json({ data: { assignments } });
});

router.get('/upcoming', async (req, res) => {
  const assignments = await assignmentService.getUpcomingAssignments(req.user!.id);
  res.json({ data: { assignments } });
});

router.get('/:id', async (req, res) => {
  const assignment = await assignmentService.getAssignmentById(req.params.id, req.user!.id);
  res.json({ data: { assignment } });
});

router.put('/:id', async (req, res) => {
  const input = updateAssignmentSchema.parse(req.body);
  const assignment = await assignmentService.updateAssignment(req.params.id, input, req.user!.id);
  res.json({ data: { assignment } });
});

router.delete('/:id', async (req, res) => {
  await assignmentService.deleteAssignment(req.params.id, req.user!.id);
  res.status(204).end();
});

export const assignmentRouter = router;
