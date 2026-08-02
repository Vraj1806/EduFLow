import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/db.js';
import { app, registerFaculty, resetDb } from './helpers.js';

describe('ai service', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/ai/status', () => {
    it('reports not configured when no provider env vars are set', async () => {
      const session = await registerFaculty();
      const res = await request(app).get('/api/ai/status').set('Cookie', session.accessToken);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        configured: false,
        provider: null,
        capabilities: [],
      });
    });
  });

  describe('POST /api/ai/classify', () => {
    it('returns 503 AI_NOT_CONFIGURED when disabled', async () => {
      const session = await registerFaculty();
      const res = await request(app)
        .post('/api/ai/classify')
        .set('Cookie', session.accessToken)
        .send({ text: 'I will be absent tomorrow' });

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('AI_NOT_CONFIGURED');
    });
  });
});
