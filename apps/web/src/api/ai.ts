import type { AIClassification, AIStatus } from '@eduflow/shared';
import { apiFetch } from './client.ts';

export async function getAIStatus(): Promise<AIStatus> {
  return apiFetch('/ai/status');
}

export async function classifyMessage(text: string): Promise<AIClassification> {
  return apiFetch('/ai/classify', { method: 'POST', body: JSON.stringify({ text }) });
}
