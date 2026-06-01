import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { walk } from './walker.js';
import type { WalkRequest } from './types.js';

const app = new Hono();
const SECRET = process.env.WORKER_SECRET || '';
const PORT = parseInt(process.env.PORT || '8080', 10);

app.get('/health', (c) => c.json({ ok: true, version: '0.1.0' }));

app.post('/walk', async (c) => {
  // Shared-secret auth (set WORKER_SECRET in Fly secrets, mirror in Next env).
  if (SECRET) {
    const got = c.req.header('x-stackscore-secret');
    if (got !== SECRET) return c.json({ error: 'UNAUTHORIZED' }, 401);
  }

  let body: WalkRequest;
  try { body = await c.req.json(); } catch { return c.json({ error: 'BAD_JSON' }, 400); }

  if (!body?.url || typeof body.url !== 'string') {
    return c.json({ error: 'URL_REQUIRED' }, 400);
  }
  const maxSteps = Math.min(Math.max(body.maxSteps ?? 6, 1), 8);

  try {
    const result = await walk(body.url, maxSteps);
    return c.json(result);
  } catch (e: any) {
    return c.json({ error: 'WALK_FAILED', message: e?.message || 'unknown' }, 500);
  }
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`stackscore-worker listening on :${info.port}`);
});
