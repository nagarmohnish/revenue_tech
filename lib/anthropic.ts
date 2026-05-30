import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';

let _client: Anthropic | null = null;

export function anthropicConfigured() {
  return !!env.anthropicKey;
}

export function anthropic(): Anthropic {
  if (!env.anthropicKey) throw new Error('Anthropic not configured. Set ANTHROPIC_API_KEY.');
  if (!_client) _client = new Anthropic({ apiKey: env.anthropicKey });
  return _client;
}

export const MODEL = 'claude-sonnet-4-6';
