// Core Playwright crawl loop. Visits the start URL, then steps forward by
// clicking the most purchase-intent CTA on each page. Stops when a terminal
// condition is hit. Returns a fully-typed WalkResponse.

import { chromium, Browser } from 'playwright';
import { extractSignals } from './signals.js';
import { pickPrimaryCta } from './cta.js';
import { classify } from './classify.js';
import type { FlowStep, StepClass, TerminalReason, WalkResponse } from './types.js';

const VIEWPORT = { width: 1280, height: 800 };
const NAV_TIMEOUT_MS = 15_000;
const STEP_BUDGET_MS = 18_000;          // per step total budget
const SCREENSHOT_QUALITY = 75;
const TOTAL_BUDGET_MS = 90_000;

const EXTERNAL_PAYMENT_DOMAINS = [
  'checkout.stripe.com',
  'pay.stripe.com',
  'paypal.com',
  'sandbox.paypal.com',
  'razorpay.com',
  'cashfree.com',
  'adyen.com',
  'braintreepayments.com',
];

function isExternalPayment(url: string): boolean {
  try { return EXTERNAL_PAYMENT_DOMAINS.some((d) => new URL(url).hostname.endsWith(d)); }
  catch { return false; }
}

function normalizeUrl(s: string): string {
  let u = s.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

export async function walk(rawUrl: string, maxSteps: number): Promise<WalkResponse> {
  const startUrl = normalizeUrl(rawUrl);
  const t0 = Date.now();

  const browser: Browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const ctx = await browser.newContext({
      viewport: VIEWPORT,
      userAgent: 'Mozilla/5.0 (compatible; StackScoreBot/0.2; +https://nagarmohnish.github.io/revenue_tech/stackscore)',
      locale: 'en-US',
      bypassCSP: true,
    });
    ctx.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);
    ctx.setDefaultTimeout(NAV_TIMEOUT_MS);

    // tsx/esbuild injects __name() into compiled functions for stack-trace
    // naming. That helper doesn't exist in the browser context, so any
    // page.evaluate() that touches a named function ReferenceErrors.
    // Inject a no-op polyfill as a raw string so tsx itself doesn't transform it.
    await ctx.addInitScript({
      content: 'if(typeof globalThis.__name!=="function"){globalThis.__name=function(f){return f;};}',
    });

    const page = await ctx.newPage();
    const steps: FlowStep[] = [];
    const seenUrls = new Set<string>();
    const clickedCtas = new Set<string>();
    let terminatedReason: TerminalReason = 'completed';
    let hostname = '';

    // First navigation: the start URL.
    let navTarget: string | null = startUrl;
    let stepIndex = 0;

    while (stepIndex < maxSteps && (Date.now() - t0) < TOTAL_BUDGET_MS) {
      // ── navigate ─────────────────────────────────────────────────
      const navStart = Date.now();
      try {
        if (navTarget) {
          await page.goto(navTarget, { waitUntil: 'domcontentloaded' });
        }
        // Allow client-side JS to settle a touch (without waiting for networkidle which can hang).
        await page.waitForLoadState('load', { timeout: 8_000 }).catch(() => {});
        await page.waitForTimeout(750);
      } catch (e) {
        terminatedReason = 'navigation_error';
        break;
      }
      const loadTimeMs = Date.now() - navStart;
      const currentUrl = page.url();
      if (!hostname) try { hostname = new URL(currentUrl).hostname; } catch {}

      // External payment domains terminate.
      if (stepIndex > 0 && isExternalPayment(currentUrl)) {
        terminatedReason = 'external_redirect';
        steps[steps.length - 1].terminalReason = 'external_redirect';
        break;
      }

      // Loop check.
      const normCurrent = currentUrl.split('#')[0];
      if (seenUrls.has(normCurrent) && stepIndex > 0) {
        terminatedReason = 'loop';
        steps[steps.length - 1].terminalReason = 'loop';
        break;
      }
      seenUrls.add(normCurrent);

      // ── extract ──────────────────────────────────────────────────
      const signals = await extractSignals(page, loadTimeMs);
      const classification: StepClass = classify(currentUrl, signals, stepIndex === 0);
      const title = (await page.title()).slice(0, 200);

      // ── screenshot (small JPEG) ──────────────────────────────────
      const buf = await page.screenshot({ type: 'jpeg', quality: SCREENSHOT_QUALITY, fullPage: false });
      const screenshotBase64 = buf.toString('base64');

      const step: FlowStep = {
        index: stepIndex,
        url: currentUrl,
        title,
        screenshotBase64,
        classification,
        signals,
        clickedCtaText: null,
        terminalReason: null,
      };
      steps.push(step);

      // ── terminal classifications ─────────────────────────────────
      if (classification === 'payment') {
        terminatedReason = 'payment_reached';
        step.terminalReason = 'payment_reached';
        break;
      }
      if (classification === 'success') {
        terminatedReason = 'success_page';
        step.terminalReason = 'success_page';
        break;
      }
      if (classification === 'auth_wall') {
        terminatedReason = 'auth_wall';
        step.terminalReason = 'auth_wall';
        break;
      }
      if (stepIndex === maxSteps - 1) {
        terminatedReason = 'max_steps';
        step.terminalReason = 'max_steps';
        break;
      }

      // ── pick + click the next CTA ────────────────────────────────
      const cta = await pickPrimaryCta(page, classification, clickedCtas);
      if (!cta) {
        terminatedReason = 'no_progress';
        step.terminalReason = 'no_progress';
        break;
      }
      const clickedText = (await cta.textContent().catch(() => null))?.trim().replace(/\s+/g, ' ') || null;
      step.clickedCtaText = clickedText;
      if (clickedText) clickedCtas.add(clickedText.toLowerCase());

      try {
        await Promise.race([
          Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: STEP_BUDGET_MS }).catch(() => null),
            cta.click({ timeout: 5000 }).catch(() => null),
          ]),
          page.waitForTimeout(STEP_BUDGET_MS),
        ]);
      } catch {
        // ignore — we'll measure progress on the next iteration
      }
      navTarget = null; // already navigated via click
      stepIndex += 1;
    }

    if (stepIndex >= maxSteps) terminatedReason = 'max_steps';
    return {
      startUrl,
      hostname,
      steps,
      terminatedReason,
      durationMs: Date.now() - t0,
    };
  } finally {
    await browser.close().catch(() => {});
  }
}
