import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { chromium } from 'playwright';
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

// POST /pdf  — renders a URL to PDF bytes via headless Chromium.
// Used by the Pricing Audit tool's /api/audit/[id]/pdf route to generate the
// branded report PDF from the /audit/r/[id]/print page.
app.post('/pdf', async (c) => {
  if (SECRET) {
    const got = c.req.header('x-stackscore-secret');
    if (got !== SECRET) return c.json({ error: 'UNAUTHORIZED' }, 401);
  }
  let body: { url?: string; format?: string };
  try { body = await c.req.json(); } catch { return c.json({ error: 'BAD_JSON' }, 400); }
  if (!body?.url || typeof body.url !== 'string') return c.json({ error: 'URL_REQUIRED' }, 400);

  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx  = await browser.newContext({ viewport: { width: 1280, height: 1700 } });
    await ctx.addInitScript({
      content: 'if(typeof globalThis.__name!=="function"){globalThis.__name=function(f){return f;};}',
    });
    const page = await ctx.newPage();
    await page.goto(body.url, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '14mm', right: '14mm', bottom: '16mm', left: '14mm' },
    });
    return new Response(pdf, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-length': String(pdf.length),
      },
    });
  } catch (e: any) {
    return c.json({ error: 'PDF_FAILED', message: e?.message || 'unknown' }, 500);
  } finally {
    await browser?.close().catch(() => {});
  }
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`stackscore-worker listening on :${info.port}`);
});
