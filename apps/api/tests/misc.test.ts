import request from 'supertest';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { getConfig } from '../src/config.js';
import { prisma } from '../src/db.js';
import { errorHandler } from '../src/middleware/error.js';
import { classifyMessage, getAIStatus } from '../src/services/ai.service.js';
import * as mlClient from '../src/services/ml.client.js';
import { app } from './helpers.js';

const AI_KEYS = ['AI_ENABLED', 'AI_PROVIDER', 'AI_BASE_URL', 'AI_API_KEY', 'AI_MODEL'] as const;
const ML_KEYS = ['ML_ENABLED', 'ML_SERVICE_URL', 'ML_CONFIDENCE_THRESHOLD'] as const;

function setAI(overrides: Partial<Record<(typeof AI_KEYS)[number], string>>) {
  for (const key of AI_KEYS) {
    if (key in overrides) process.env[key] = overrides[key] as string;
    else delete process.env[key];
  }
}

function setML(overrides: Partial<Record<(typeof ML_KEYS)[number], string>>) {
  for (const key of ML_KEYS) {
    if (key in overrides) process.env[key] = overrides[key] as string;
    else delete process.env[key];
  }
}

function mlHealthResponse() {
  return {
    status: 'ok',
    backend: 'demo',
    models: ['face_detection', 'face_embedding'],
    modelVersion: 'demo-v1.0',
    embeddingDim: 512,
    device: 'demo',
    loaded: true,
  };
}

describe('GET /api/health', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports database up and a healthy ML sidecar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => mlHealthResponse() }));
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      status: 'ok',
      database: 'up',
      ml: {
        enabled: true,
        configured: true,
        url: 'http://ml.test',
        status: 'ok',
        backend: 'demo',
        modelVersion: 'demo-v1.0',
      },
    });
  });

  it('reports ML degraded when the sidecar is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      status: 'ok',
      database: 'up',
      ml: { enabled: true, status: 'degraded' },
    });
  });
});

describe('notFoundHandler', () => {
  it('returns a 404 JSON envelope for unknown routes', async () => {
    const res = await request(app).get('/api/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('errorHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a 500 envelope for unknown errors', () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(new Error('boom'), {} as never, { status, json } as never, vi.fn() as never);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  });
});

describe('getConfig', () => {
  it('fails fast when required secrets are missing', () => {
    expect(() =>
      getConfig({ NODE_ENV: 'test', DATABASE_URL: 'file:./x.db' } as NodeJS.ProcessEnv)
    ).toThrow(/Invalid environment configuration/);
  });
});

describe('ai.service (unit)', () => {
  const saved = new Map<string, string | undefined>(
    AI_KEYS.map((k) => [k, process.env[k]])
  );

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(() => {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    prisma.$disconnect();
  });

  it('reports configured=true with capabilities when fully configured', () => {
    setAI({
      AI_ENABLED: 'true',
      AI_PROVIDER: 'openai',
      AI_BASE_URL: 'https://api.example.com',
      AI_API_KEY: 'secret',
      AI_MODEL: 'gpt-4o',
    });
    expect(getAIStatus()).toEqual({
      configured: true,
      provider: 'openai',
      capabilities: ['classifyMessage'],
    });
  });

  it('reports configured=false when only some vars are set', () => {
    setAI({ AI_ENABLED: 'true', AI_PROVIDER: 'openai' });
    expect(getAIStatus().configured).toBe(false);
  });

  it('classifies a message from a valid provider response and clamps confidence', async () => {
    setAI({
      AI_ENABLED: 'true',
      AI_PROVIDER: 'openai',
      AI_BASE_URL: 'https://api.example.com/',
      AI_API_KEY: 'secret',
      AI_MODEL: 'gpt-4o',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({ category: 'ABSENCE', confidence: 1.4, reasoning: 'sick' }),
              },
            },
          ],
        }),
      })
    );

    const result = await classifyMessage('I will be absent tomorrow');
    expect(result).toEqual({ category: 'ABSENCE', confidence: 1, reasoning: 'sick' });
  });

  it('coerces an unknown category to OTHER', async () => {
    setAI({
      AI_ENABLED: 'true',
      AI_PROVIDER: 'openai',
      AI_BASE_URL: 'https://api.example.com',
      AI_API_KEY: 'secret',
      AI_MODEL: 'gpt-4o',
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ category: 'WEIRD', confidence: 0.4 }) } }],
        }),
      })
    );

    const result = await classifyMessage('hello');
    expect(result.category).toBe('OTHER');
    expect(result.confidence).toBe(0.4);
  });

  it('throws AI_REQUEST_FAILED when the provider errors', async () => {
    setAI({
      AI_ENABLED: 'true',
      AI_PROVIDER: 'openai',
      AI_BASE_URL: 'https://api.example.com',
      AI_API_KEY: 'secret',
      AI_MODEL: 'gpt-4o',
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(classifyMessage('hello')).rejects.toMatchObject({
      statusCode: 503,
      code: 'AI_REQUEST_FAILED',
    });
  });

  it('throws AI_REQUEST_FAILED when the provider returns empty content', async () => {
    setAI({
      AI_ENABLED: 'true',
      AI_PROVIDER: 'openai',
      AI_BASE_URL: 'https://api.example.com',
      AI_API_KEY: 'secret',
      AI_MODEL: 'gpt-4o',
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [] }) }));

    await expect(classifyMessage('hello')).rejects.toMatchObject({ code: 'AI_REQUEST_FAILED' });
  });

  it('throws AI_NOT_CONFIGURED when disabled', async () => {
    setAI({});
    await expect(classifyMessage('hello')).rejects.toMatchObject({
      statusCode: 503,
      code: 'AI_NOT_CONFIGURED',
    });
  });
});

describe('ml.client (unit)', () => {
  const saved = new Map<string, string | undefined>(ML_KEYS.map((k) => [k, process.env[k]]));

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(() => {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('reports enabled/configured from config', () => {
    setML({ ML_ENABLED: 'true', ML_SERVICE_URL: 'http://ml.test', ML_CONFIDENCE_THRESHOLD: '0.5' });
    expect(mlClient.getMLStatus()).toEqual({ enabled: true, configured: true, url: 'http://ml.test' });
  });

  it('throws ML_NOT_CONFIGURED when disabled', async () => {
    setML({});
    await expect(mlClient.embed('data:image/png;base64,AAAA')).rejects.toMatchObject({
      statusCode: 503,
      code: 'ML_NOT_CONFIGURED',
    });
  });

  it('parses an embed response', async () => {
    setML({ ML_ENABLED: 'true', ML_SERVICE_URL: 'http://ml.test' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ embedding: [1, 2, 3], modelVersion: 'demo-v1.0', confidence: 0.9 }),
      })
    );
    await expect(mlClient.embed('data:image/png;base64,AAAA')).resolves.toEqual({
      embedding: [1, 2, 3],
      modelVersion: 'demo-v1.0',
      confidence: 0.9,
    });
  });

  it('surfaces a 422 response with the ML detail', async () => {
    setML({ ML_ENABLED: 'true', ML_SERVICE_URL: 'http://ml.test' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: 'multiple faces detected' }),
      })
    );
    await expect(mlClient.embed('data:image/png;base64,AAAA')).rejects.toMatchObject({
      statusCode: 422,
      code: 'ML_REQUEST_FAILED',
      message: 'multiple faces detected',
    });
  });

  it('parses a detect-multi response', async () => {
    setML({ ML_ENABLED: 'true', ML_SERVICE_URL: 'http://ml.test' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ faces: [{ faceIndex: 0, confidence: 0.9, boundingBox: {}, embedding: [1] }] }),
      })
    );
    await expect(mlClient.detectMulti('x')).resolves.toEqual({
      faces: [{ faceIndex: 0, confidence: 0.9, boundingBox: {}, embedding: [1] }],
    });
  });

  it('throws ML_UNAVAILABLE when the sidecar is unreachable', async () => {
    setML({ ML_ENABLED: 'true', ML_SERVICE_URL: 'http://ml.test' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    await expect(mlClient.health()).rejects.toMatchObject({ statusCode: 503, code: 'ML_UNAVAILABLE' });
  });

  it('throws ML_SERVICE_UNAVAILABLE when the backend reports 503', async () => {
    setML({ ML_ENABLED: 'true', ML_SERVICE_URL: 'http://ml.test' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ detail: 'ML backend unavailable: boom' }),
      })
    );
    await expect(mlClient.embed('x')).rejects.toMatchObject({
      statusCode: 503,
      code: 'ML_SERVICE_UNAVAILABLE',
    });
  });
});
