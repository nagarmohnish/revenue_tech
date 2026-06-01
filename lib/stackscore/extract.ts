// HTML signal extractor for StackScore.
//
// Fetches a pricing/checkout page server-side and turns its rendered HTML
// into a typed `Signals` object that the scorer can grade deterministically.
//
// Conservative on the network side:
//   - 8s timeout
//   - 2 MB response cap (stream-aborted at the boundary)
//   - Real-browser-ish User-Agent (some sites 403 default fetch UAs)
//   - Single redirect chain follows fetch's defaults; no JS execution
//
// Anything we can't see in the rendered HTML simply scores as "not detected".

import * as cheerio from 'cheerio';
import { Signals } from './types';
import { normalizeAndValidateUrl } from './url';

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES        = 2 * 1024 * 1024;
const UA               = 'Mozilla/5.0 (compatible; StackScoreBot/0.1; +https://nagarmohnish.github.io/revenue_tech/stackscore)';

export async function fetchAndExtract(rawUrl: string): Promise<Signals> {
  const { url, hostname } = normalizeAndValidateUrl(rawUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html = '';
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`The page returned ${res.status} ${res.statusText}`);
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html')) {
      throw new Error('That URL did not return an HTML page');
    }
    html = await readBoundedText(res, MAX_BYTES);
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new Error('Fetching that page timed out (8s)');
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  return extractSignalsFromHtml(html, { url, hostname });
}

async function readBoundedText(res: Response, max: number): Promise<string> {
  if (!res.body) return await res.text();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > max) {
      reader.cancel().catch(() => {});
      break;
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(total > max ? max : total);
  let offset = 0;
  for (const c of chunks) {
    const fit = Math.min(c.byteLength, buf.byteLength - offset);
    buf.set(c.subarray(0, fit), offset);
    offset += fit;
    if (offset >= buf.byteLength) break;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(buf);
}

export function extractSignalsFromHtml(
  html: string,
  meta: { url: string | null; hostname: string | null },
): Signals {
  const $ = cheerio.load(html);
  // Strip noise that can confuse signal detection.
  $('script, style, noscript, svg, head > link').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  // ── pricing structure ─────────────────────────────────────────────────────
  const priceRe = /[\$€£₹](\s?)(\d{1,5}(?:\.\d{1,2})?)(?:\s?\/\s?(?:mo|month|yr|year|user|seat))?/g;
  const pricePoints: number[] = [];
  const currencySet = new Set<string>();
  for (const m of text.matchAll(priceRe)) {
    const sym = m[0].trim().charAt(0);
    currencySet.add(sym);
    const n = parseFloat(m[2]);
    if (Number.isFinite(n) && n > 0 && n < 100000) pricePoints.push(n);
  }
  const uniquePrices = Array.from(new Set(pricePoints)).sort((a, b) => a - b);

  // Plan count heuristic: pricing cards typically share a class or are siblings.
  // Trust the larger of (semantic card count, unique-price count) but cap at 6.
  const cardSelectors = [
    '[class*="pricing"] [class*="card"]',
    '[class*="plan"][class*="card"]',
    '[class*="price"][class*="card"]',
    '[class*="tier"]',
    '[class*="plan-card"]',
    '[class*="pricingCard"]',
    'article[class*="plan"]',
  ];
  let semanticPlans = 0;
  for (const sel of cardSelectors) {
    semanticPlans = Math.max(semanticPlans, $(sel).length);
  }
  const planCount = Math.min(6, Math.max(semanticPlans, Math.min(uniquePrices.length, 5)));

  // ── tier markers ──────────────────────────────────────────────────────────
  const hasFree       = /\bfree\b/.test(lower);
  const hasTrial      = /\b(free\s*trial|start\s*free|try\s*(it\s*)?free|14[-\s]day\s*trial|30[-\s]day\s*trial|no\s*credit\s*card)\b/.test(lower);
  const hasFreemium   = /\b(free\s*forever|free\s*plan|free\s*tier|always\s*free|\$0(\b|\/))/.test(lower);
  const hasEnterprise = /\b(enterprise|contact\s*(sales|us)|custom\s*(pricing|plan)|talk\s*to\s*(sales|us))\b/.test(lower);

  // ── toggles ───────────────────────────────────────────────────────────────
  const mentionsMonthly = /\b(monthly|per\s*month|\/\s*mo\b)/.test(lower);
  const mentionsAnnual  = /\b(annually|annual|yearly|per\s*year|\/\s*yr\b|\/\s*year\b)/.test(lower);
  const hasAnnualMonthlyToggle = mentionsMonthly && mentionsAnnual;
  const hasAnnualDiscount = /\bsave\s*(up\s*to\s*)?\d{1,2}\s*%|\d{1,2}\s*%\s*(off|discount|cheaper)|2\s*months?\s*free|get\s*\d{1,2}\s*%\s*off/.test(lower);

  // ── CTAs ──────────────────────────────────────────────────────────────────
  const ctaNodes = $('a, button').filter((_, el) => {
    const $el = $(el);
    const cls = ($el.attr('class') || '').toLowerCase();
    const role = ($el.attr('role') || '').toLowerCase();
    const txt = ($el.text() || '').trim().toLowerCase();
    if (!txt) return false;
    if (txt.length > 40) return false;
    if (/(btn|button|cta|primary)/.test(cls) || role === 'button') return true;
    return /^(start|get|try|sign\s*up|buy|subscribe|upgrade|book|talk|contact|choose)/.test(txt);
  });
  const ctaCount = ctaNodes.length;
  const primaryCtaText = ctaNodes
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((s) => s.length > 0 && s.length < 40)
    .sort((a, b) => b.length - a.length)[0] || null;

  const hasHighlightedPlan = /\b(most\s*popular|best\s*value|recommended|popular\s*choice|most\s*loved)\b/.test(lower);

  // ── social proof ──────────────────────────────────────────────────────────
  const hasTestimonials =
    /\b(testimonial|customer\s*stor(y|ies)|what\s*(our\s*)?customers\s*say|loved\s*by)\b/.test(lower) ||
    $('blockquote').length >= 1;
  const hasLogos = /\b(trusted\s*by|customers\s*include|used\s*by|powering\s*teams\s*at|in\s*good\s*company)\b/.test(lower);

  // ── trust ─────────────────────────────────────────────────────────────────
  const paymentMethods: string[] = [];
  if (/\bstripe\b/.test(lower))    paymentMethods.push('Stripe');
  if (/\bpaypal\b/.test(lower))    paymentMethods.push('PayPal');
  if (/\bapple\s*pay\b/.test(lower)) paymentMethods.push('Apple Pay');
  if (/\bgoogle\s*pay\b/.test(lower)) paymentMethods.push('Google Pay');
  if (/\brazorpay\b/.test(lower))  paymentMethods.push('Razorpay');
  if (/\bupi\b/.test(lower))       paymentMethods.push('UPI');
  if (/\bach\b|\bbank\s*transfer\b|\bwire\b/.test(lower)) paymentMethods.push('ACH');

  const hasSecurityBadges = /\b(ssl|256[-\s]?bit|pci[-\s]?dss|soc\s*2|gdpr|secure\s*(checkout|payment))\b/.test(lower);
  const hasGuarantee = /\b(money[-\s]back|cancel\s*any\s*time|no\s*questions\s*asked|14[-\s]day\s*refund|30[-\s]day\s*refund|free\s*to\s*cancel)\b/.test(lower);

  // ── content ───────────────────────────────────────────────────────────────
  const hasFAQ = /\b(faq|frequently\s*asked|common\s*questions)\b/.test(lower) || $('details').length >= 2;
  const hasCancellationMessaging = /\b(cancel\s*any\s*time|no\s*lock[-\s]?in|no\s*commitment|month[-\s]?to[-\s]?month)\b/.test(lower);

  const title = ($('title').first().text() || '').trim().slice(0, 200);

  return {
    currencySymbols: Array.from(currencySet),
    pricePoints: uniquePrices,
    planCount,
    hasFree,
    hasTrial,
    hasFreemium,
    hasEnterprise,
    hasAnnualMonthlyToggle,
    hasAnnualDiscount,
    ctaCount,
    primaryCtaText,
    hasHighlightedPlan,
    hasTestimonials,
    hasLogos,
    paymentMethods,
    hasSecurityBadges,
    hasGuarantee,
    hasFAQ,
    hasCancellationMessaging,
    title,
    url: meta.url,
    hostname: meta.hostname,
    htmlSize: html.length,
  };
}
