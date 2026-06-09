// Pricing-page scraper for Tool 1.
//
// Given a domain, find the pricing page (heuristically — try common paths,
// fall back to homepage), fetch the rendered HTML server-side, extract the
// signals we need to reason about pricing + business model.

import * as cheerio from 'cheerio';
import type { ScrapedPricing } from './types';

const TIMEOUT_MS = 9_000;
const MAX_BYTES  = 2 * 1024 * 1024;
const UA         = 'Mozilla/5.0 (compatible; AgentMintAuditBot/0.1; +https://nagarmohnish.github.io/revenue_tech/audit)';
const COMMON_PRICING_PATHS = ['/pricing', '/plans', '/subscribe', '/pricing/', '/plans/', '/billing'];

function normalizeUrl(raw: string): { url: string; hostname: string } {
  if (!raw) throw new Error('Domain is required');
  let s = raw.trim().toLowerCase();
  if (!/^https?:\/\//.test(s)) s = 'https://' + s;
  const u = new URL(s);
  return { url: u.origin, hostname: u.hostname.replace(/^www\./, '') };
}

async function fetchWithBounds(url: string): Promise<{ html: string; finalUrl: string; status: number } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html')) return null;
    if (!res.body) return { html: await res.text(), finalUrl: res.url, status: res.status };

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_BYTES) { reader.cancel().catch(() => {}); break; }
      chunks.push(value);
    }
    const cap = Math.min(total, MAX_BYTES);
    const buf = new Uint8Array(cap);
    let offset = 0;
    for (const c of chunks) {
      const fit = Math.min(c.byteLength, buf.byteLength - offset);
      buf.set(c.subarray(0, fit), offset);
      offset += fit;
      if (offset >= cap) break;
    }
    const html = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    return { html, finalUrl: res.url, status: res.status };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function scrapeDomainPricing(rawDomain: string): Promise<ScrapedPricing> {
  const { url: origin, hostname } = normalizeUrl(rawDomain);

  // Try common pricing-page paths first; fall back to homepage.
  let html = '';
  let finalUrl = origin;
  for (const path of COMMON_PRICING_PATHS) {
    const target = origin + path;
    const r = await fetchWithBounds(target);
    if (r && r.html && r.html.length > 5000) { html = r.html; finalUrl = r.finalUrl; break; }
  }
  if (!html) {
    const r = await fetchWithBounds(origin);
    if (!r) throw new Error(`Could not reach ${origin}`);
    html = r.html; finalUrl = r.finalUrl;
  }

  return extractFromHtml(html, finalUrl, hostname);
}

export function extractFromHtml(html: string, url: string, hostname: string): ScrapedPricing {
  const $ = cheerio.load(html);
  $('script, style, noscript, svg, head > link').remove();

  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();

  // ── pricing structure ─────────────────────────────────────────────
  const priceRe = /[\$€£₹](\s?)(\d{1,5}(?:\.\d{1,2})?)(?:\s?\/\s?(?:mo|month|yr|year|user|seat))?/g;
  const pricePoints: number[] = [];
  const currencySet = new Set<string>();
  for (const m of text.matchAll(priceRe)) {
    currencySet.add(m[0].trim().charAt(0));
    const n = parseFloat(m[2]);
    if (Number.isFinite(n) && n > 0 && n < 100000) pricePoints.push(n);
  }
  const uniquePrices = Array.from(new Set(pricePoints)).sort((a, b) => a - b).slice(0, 12);

  // Tier count heuristic
  const cardSelectors = [
    '[class*="pricing"] [class*="card"]', '[class*="plan"][class*="card"]',
    '[class*="price"][class*="card"]',     '[class*="tier"]',
    '[class*="plan-card"]',                '[class*="pricingCard"]',
    'article[class*="plan"]',
  ];
  let semanticTiers = 0;
  for (const sel of cardSelectors) semanticTiers = Math.max(semanticTiers, $(sel).length);
  const tierCount = Math.min(6, Math.max(semanticTiers, Math.min(uniquePrices.length, 5)));

  // ── tier markers ──────────────────────────────────────────────────
  const hasFree       = /\bfree\b/.test(lower);
  const hasTrial      = /\b(free\s*trial|start\s*free|try\s*(it\s*)?free|14[-\s]day\s*trial|30[-\s]day\s*trial|no\s*credit\s*card)\b/.test(lower);
  const hasFreemium   = /\b(free\s*forever|free\s*plan|free\s*tier|always\s*free|\$0(\b|\/))/.test(lower);
  const hasEnterprise = /\b(enterprise|contact\s*(sales|us)|custom\s*(pricing|plan)|talk\s*to\s*(sales|us))\b/.test(lower);

  // ── toggles ───────────────────────────────────────────────────────
  const mentionsMonthly = /\b(monthly|per\s*month|\/\s*mo\b)/.test(lower);
  const mentionsAnnual  = /\b(annually|annual|yearly|per\s*year|\/\s*yr\b|\/\s*year\b)/.test(lower);
  const hasAnnualMonthlyToggle = mentionsMonthly && mentionsAnnual;
  const hasAnnualDiscount = /\bsave\s*(up\s*to\s*)?\d{1,2}\s*%|\d{1,2}\s*%\s*(off|discount|cheaper)|2\s*months?\s*free/.test(lower);

  // ── trust + social proof ──────────────────────────────────────────
  const paymentMethods: string[] = [];
  if (/\bstripe\b/.test(lower))    paymentMethods.push('Stripe');
  if (/\bpaypal\b/.test(lower))    paymentMethods.push('PayPal');
  if (/\bapple\s*pay\b/.test(lower)) paymentMethods.push('Apple Pay');
  if (/\bgoogle\s*pay\b/.test(lower)) paymentMethods.push('Google Pay');
  if (/\brazorpay\b/.test(lower))  paymentMethods.push('Razorpay');
  if (/\bupi\b/.test(lower))       paymentMethods.push('UPI');

  const hasSecurityBadges = /\b(ssl|256[-\s]?bit|pci[-\s]?dss|soc\s*2|gdpr|secure\s*(checkout|payment))\b/.test(lower);
  const hasGuarantee      = /\b(money[-\s]back|cancel\s*any\s*time|no\s*questions\s*asked|14[-\s]day\s*refund|30[-\s]day\s*refund)\b/.test(lower);
  const hasTestimonials   = /\b(testimonial|customer\s*stor(y|ies)|what\s*(our\s*)?customers\s*say|loved\s*by)\b/.test(lower) || $('blockquote').length >= 1;
  const hasLogos          = /\b(trusted\s*by|customers\s*include|used\s*by|powering\s*teams\s*at|in\s*good\s*company)\b/.test(lower);
  const hasHighlightedPlan = /\b(most\s*popular|best\s*value|recommended|popular\s*choice|most\s*loved)\b/.test(lower);

  // ── CTA discovery ─────────────────────────────────────────────────
  const ACTION_RE = /^(start|get|try|sign\s*up|sign\s*in|log\s*in|buy|subscribe|upgrade|book|talk|contact|choose|select|continue|next|checkout)\b/i;
  const ctas = $('a, button').map((_, el) => {
    const $el = $(el);
    const txt = ($el.text() || '').trim().replace(/\s+/g, ' ');
    if (!txt || txt.length > 40 || !ACTION_RE.test(txt)) return null;
    return txt;
  }).get().filter(Boolean) as string[];
  const primaryCtaText = ctas[0] || null;

  // ── meta extraction (theme color, favicon, title, description) ────
  const title       = ($('title').first().text() || '').trim().slice(0, 200);
  const description = ($('meta[name="description"]').attr('content') || '').trim().slice(0, 400);
  const themeColor  = ($('meta[name="theme-color"]').attr('content') || '').trim() || null;
  let faviconUrl: string | null = null;
  $('link[rel*="icon"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !faviconUrl) {
      try { faviconUrl = new URL(href, url).toString(); } catch { /* skip */ }
    }
  });

  return {
    url,
    title,
    description,
    hostname,
    pricePoints: uniquePrices,
    currencySymbols: Array.from(currencySet),
    tierCount,
    hasFree, hasTrial, hasFreemium, hasEnterprise,
    hasAnnualMonthlyToggle, hasAnnualDiscount,
    paymentMethods,
    hasSecurityBadges, hasGuarantee, hasTestimonials, hasLogos,
    hasHighlightedPlan,
    primaryCtaText,
    themeColor,
    faviconUrl,
    htmlSize: html.length,
  };
}
