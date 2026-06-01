// Client for the Fly.io-deployed Playwright worker. Stays *one* HTTP hop —
// the worker returns a fully-typed WalkResponse that we then score locally.

import { env } from '../env';
import type { WalkResponse } from './types';

export async function callWorker(url: string, maxSteps = 6): Promise<WalkResponse> {
  const base = (process.env.STACKSCORE_WORKER_URL || '').replace(/\/+$/, '');
  const secret = process.env.STACKSCORE_WORKER_SECRET || '';
  if (!base) throw new Error('STACKSCORE_WORKER_URL is not set. Deploy the worker (see worker/README.md) and set the env var.');

  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (secret) headers['x-stackscore-secret'] = secret;

  // Worker total budget is ~90s; add a small client cushion.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 110_000);
  try {
    const res = await fetch(base + '/walk', {
      method: 'POST',
      headers,
      body: JSON.stringify({ url, maxSteps }),
      signal: controller.signal,
    });
    const text = await res.text();
    let body: any = {};
    try { body = text ? JSON.parse(text) : {}; } catch { /* leave empty */ }
    if (!res.ok) {
      throw new Error(body?.message || body?.error || `Worker returned ${res.status}`);
    }
    return body as WalkResponse;
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('Funnel walk timed out (>110s). Try a shorter funnel or check the worker.');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// Tiny env shim so this file doesn't import env directly if not needed in build.
void env;
