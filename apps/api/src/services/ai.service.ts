import type { AIClassification, AIStatus, MessageCategory } from '@eduflow/shared';
import { getConfig } from '../config.js';
import { AppError } from '../middleware/error.js';

/**
 * AI Service
 *
 * Central integration point for AI features (message categorization, response
 * generation). The rest of the application talks to this service instead of
 * depending on a specific LLM provider, so the provider can be swapped later
 * without rewriting callers.
 *
 * When no provider is configured (`AI_ENABLED=false`), classification throws a
 * clear 503 so callers never receive fabricated results.
 */

const CATEGORIES: MessageCategory[] = [
  'ABSENCE',
  'ASSIGNMENT',
  'QUESTION',
  'REQUEST',
  'GENERAL',
  'OTHER',
];

export function getAIStatus(): AIStatus {
  const cfg = getConfig();
  const provider = cfg.AI_PROVIDER ?? null;
  const configured =
    cfg.AI_ENABLED === 'true' &&
    Boolean(provider && cfg.AI_BASE_URL && cfg.AI_API_KEY && cfg.AI_MODEL);

  return {
    configured,
    provider,
    capabilities: configured ? ['classifyMessage'] : [],
  };
}

/**
 * Classify a student message into a category.
 *
 * Integration point: this performs a real OpenAI-compatible chat-completions
 * call when the service is configured. When not configured it throws
 * AI_NOT_CONFIGURED — no fabricated results are ever returned.
 */
export async function classifyMessage(text: string): Promise<AIClassification> {
  const cfg = getConfig();
  const status = getAIStatus();

  if (!status.configured || !cfg.AI_BASE_URL || !cfg.AI_API_KEY || !cfg.AI_MODEL) {
    throw new AppError(
      503,
      'AI_NOT_CONFIGURED',
      'AI service is not configured. Set AI_ENABLED=true with AI_PROVIDER, AI_BASE_URL, AI_API_KEY and AI_MODEL to enable classification.',
    );
  }

  try {
    const res = await fetch(`${cfg.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: cfg.AI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Classify the student message into exactly one category: ABSENCE, ASSIGNMENT, QUESTION, REQUEST, GENERAL, OTHER. Respond only with JSON: {"category":"ABSENCE","confidence":0.0,"reasoning":"short reason"}.',
          },
          { role: 'user', content: text },
        ],
        temperature: 0,
      }),
    });

    if (!res.ok) {
      throw new Error(`AI provider returned status ${res.status}`);
    }

    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('AI provider returned an empty response');
    }

    const parsed = JSON.parse(content) as {
      category?: string;
      confidence?: number;
      reasoning?: string;
    };

    const category = parsed.category && CATEGORIES.includes(parsed.category as MessageCategory)
      ? (parsed.category as MessageCategory)
      : 'OTHER';

    return {
      category,
      confidence:
        typeof parsed.confidence === 'number'
          ? Math.min(Math.max(parsed.confidence, 0), 1)
          : 0,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    throw new AppError(503, 'AI_REQUEST_FAILED', `AI provider request failed: ${message}`);
  }
}
