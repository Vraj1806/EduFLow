import { getConfig } from '../config.js';
import { AppError } from '../middleware/error.js';

/**
 * ML Service Client
 *
 * Typed HTTP client for the Python FastAPI face-recognition sidecar
 * (`apps/ml`). The rest of the application talks to this client instead of
 * depending on the ML service's transport, so the sidecar can be moved or
 * swapped later without rewriting callers.
 *
 * When the sidecar is disabled (`ML_ENABLED=false`) every call throws a clear
 * 503 — callers never receive fabricated results, matching the AI service.
 */

const ML_TIMEOUT_MS = 15_000;

export interface MLStatus {
  enabled: boolean;
  configured: boolean;
  url: string;
  /** Runtime fields filled in by the health route after a successful probe. */
  status?: string;
  backend?: string | null;
  modelVersion?: string;
}

export interface MLDetection {
  detected: boolean;
  faceCount: number;
  confidence?: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface MLEmbedding {
  embedding: number[];
  modelVersion: string;
  confidence: number;
}

export interface MLDetectedFace {
  faceIndex: number;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  embedding: number[];
}

export interface MLHealth {
  status: string;
  backend: string | null;
  models: string[];
  modelVersion: string;
  embeddingDim: number;
  device: string;
  loaded: boolean;
  error?: string;
}

/** Report whether the ML sidecar is enabled and configured. */
export function getMLStatus(): MLStatus {
  const cfg = getConfig();
  const enabled = cfg.ML_ENABLED === 'true';
  return {
    enabled,
    configured: enabled && Boolean(cfg.ML_SERVICE_URL),
    url: cfg.ML_SERVICE_URL,
  };
}

async function mlRequest<T>(path: string, init: { method: string; body?: object }): Promise<T> {
  const cfg = getConfig();
  if (cfg.ML_ENABLED !== 'true') {
    throw new AppError(
      503,
      'ML_NOT_CONFIGURED',
      'ML service is not configured. Set ML_ENABLED=true and ML_SERVICE_URL to enable face recognition.',
    );
  }

  const base = cfg.ML_SERVICE_URL.replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: init.method,
      headers: {
        'Content-Type': 'application/json',
        'X-ML-Service-Secret': cfg.ML_SERVICE_SECRET,
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    throw new AppError(503, 'ML_UNAVAILABLE', `ML service request failed: ${message}`);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 503) {
    const detail = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new AppError(
      503,
      'ML_SERVICE_UNAVAILABLE',
      detail?.detail ?? 'ML service backend is unavailable',
    );
  }
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new AppError(
      res.status,
      'ML_REQUEST_FAILED',
      detail?.detail ?? `ML service returned status ${res.status}`,
    );
  }

  return (await res.json()) as T;
}

/** Detect faces in an image (registration quality check). */
export function detect(imageBase64: string): Promise<MLDetection> {
  return mlRequest<MLDetection>('/detect', { method: 'POST', body: { image: imageBase64 } });
}

/** Generate a single 512-dim embedding (exactly one face required). */
export function embed(imageBase64: string): Promise<MLEmbedding> {
  return mlRequest<MLEmbedding>('/embed', { method: 'POST', body: { image: imageBase64 } });
}

/** Detect every face in a classroom photo with per-face embeddings. */
export function detectMulti(imageBase64: string): Promise<{ faces: MLDetectedFace[] }> {
  return mlRequest<{ faces: MLDetectedFace[] }>('/detect-multi', {
    method: 'POST',
    body: { image: imageBase64 },
  });
}

/** Read the ML sidecar's health report. */
export function health(): Promise<MLHealth> {
  return mlRequest<MLHealth>('/health', { method: 'GET' });
}
