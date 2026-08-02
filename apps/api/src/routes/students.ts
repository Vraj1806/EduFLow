import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import * as studentService from '../services/student.service.js';

const router = Router();

// All student routes require authentication
router.use(requireAuth);

const createStudentSchema = z.object({
  studentId: z.string().trim().min(1, 'Student ID is required').max(50),
  rollNumber: z.string().trim().min(1, 'Roll number is required').max(50),
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  class: z.string().trim().min(1, 'Class is required').max(20),
  division: z.string().trim().min(1, 'Division is required').max(20),
  semester: z.string().trim().min(1, 'Semester is required').max(20),
  department: z.string().trim().min(1, 'Department is required').max(100),
  profilePhoto: z.string().optional(),
});

const updateStudentSchema = z.object({
  rollNumber: z.string().trim().min(1).max(50).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  class: z.string().trim().min(1).max(20).optional(),
  division: z.string().trim().min(1).max(20).optional(),
  semester: z.string().trim().min(1).max(20).optional(),
  department: z.string().trim().min(1).max(100).optional(),
  profilePhoto: z.string().optional(),
});

// GET /students - Get all students or search
router.get('/', async (req, res) => {
  const query = req.query.q;

  let students;
  if (typeof query === 'string' && query.trim().length > 0) {
    students = await studentService.searchStudents(query, req.user!.id);
  } else {
    students = await studentService.getAllStudents(req.user!.id);
  }

  res.json({ data: { students } });
});

// POST /students - Create a new student
router.post('/', async (req, res) => {
  const input = createStudentSchema.parse(req.body);
  const student = await studentService.createStudent({ ...input, facultyId: req.user!.id });
  res.status(201).json({ data: { student } });
});

// GET /students/:id - Get a single student
router.get('/:id', async (req, res) => {
  const student = await studentService.getStudentById(req.params.id, req.user!.id);
  res.json({ data: { student } });
});

// PUT /students/:id - Update a student
router.put('/:id', async (req, res) => {
  const input = updateStudentSchema.parse(req.body);
  const student = await studentService.updateStudent(req.params.id, input, req.user!.id);
  res.json({ data: { student } });
});

// DELETE /students/:id - Delete a student
router.delete('/:id', async (req, res) => {
  await studentService.deleteStudent(req.params.id, req.user!.id);
  res.status(204).end();
});

export const studentRouter = router;
