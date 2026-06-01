// Screenshot signal extractor for StackScore.
//
// Sends a screenshot to Claude (vision) and asks it to emit the exact same
// `Signals` shape we get from HTML scraping, so the downstream scorer doesn't
// care whether the source was a URL or an image.

import { anthropic, MODEL } from '../anthropic';
import { Signals } from './types';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const SYSTEM_PROMPT = `You analyze screenshots of pricing/subscription/checkout pages.

Return ONLY a JSON object matching this exact TypeScript shape (no prose, no backticks):

{
  "currencySymbols": string[],
  "pricePoints": number[],
  "planCount": number,
  "hasFree": boolean,
  "hasTrial": boolean,
  "hasFreemium": boolean,
  "hasEnterprise": boolean,
  "hasAnnualMonthlyToggle": boolean,
  "hasAnnualDiscount": boolean,
  "ctaCount": number,
  "primaryCtaText": string | null,
  "hasHighlightedPlan": boolean,
  "hasTestimonials": boolean,
  "hasLogos": boolean,
  "paymentMethods": string[],
  "hasSecurityBadges": boolean,
  "hasGuarantee": boolean,
  "hasFAQ": boolean,
  "hasCancellationMessaging": boolean,
  "title": string
}

Rules:
- pricePoints: only currency-denominated numbers visible on the page (not feature counts).
- planCount: number of distinct pricing tiers visible.
- paymentMethods: include exactly these recognized names if you see logos OR text: Stripe, PayPal, Apple Pay, Google Pay, Razorpay, UPI, ACH. Otherwise omit.
- hasHighlightedPlan: true ONLY if a tier is visually distinguished (border, badge, "Most popular").
- hasSecurityBadges: true ONLY if you see a security indicator (SSL, PCI, SOC 2, "secure checkout").
- hasGuarantee: true ONLY if you see "cancel anytime", "money-back", or similar language.
- primaryCtaText: the most prominent button label (max 40 chars), or null.
- title: a short label for the page (max 80 chars).
- Output VALID JSON. No comments, no markdown.`;

export async function extractSignalsFromImage(
  base64: string,
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif',
): Promise<Signals> {
  const bytes = Math.ceil((base64.length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) {
    throw new Error(`Screenshot is too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)} MB)`);
  }

  const client = anthropic();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text',  text: 'Analyze this pricing/subscription page screenshot. Return only the JSON object.' },
      ],
    }],
  });

  const text = res.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('').trim();
  const json = extractJsonObject(text);
  if (!json) throw new Error('Could not parse the model response');

  // Defensive defaults; normalize anything the model omits.
  const s: Signals = {
    currencySymbols:        arr(json.currencySymbols),
    pricePoints:            arr(json.pricePoints).map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n) && n > 0 && n < 100000),
    planCount:              clampInt(json.planCount, 0, 6),
    hasFree:                bool(json.hasFree),
    hasTrial:               bool(json.hasTrial),
    hasFreemium:            bool(json.hasFreemium),
    hasEnterprise:          bool(json.hasEnterprise),
    hasAnnualMonthlyToggle: bool(json.hasAnnualMonthlyToggle),
    hasAnnualDiscount:      bool(json.hasAnnualDiscount),
    ctaCount:               clampInt(json.ctaCount, 0, 50),
    primaryCtaText:         typeof json.primaryCtaText === 'string' ? json.primaryCtaText.slice(0, 40) : null,
    hasHighlightedPlan:     bool(json.hasHighlightedPlan),
    hasTestimonials:        bool(json.hasTestimonials),
    hasLogos:               bool(json.hasLogos),
    paymentMethods:         arr(json.paymentMethods).map(String),
    hasSecurityBadges:      bool(json.hasSecurityBadges),
    hasGuarantee:           bool(json.hasGuarantee),
    hasFAQ:                 bool(json.hasFAQ),
    hasCancellationMessaging: bool(json.hasCancellationMessaging),
    title:                  typeof json.title === 'string' ? json.title.slice(0, 200) : '',
    url:                    null,
    hostname:               null,
    htmlSize:               bytes,
  };
  return s;
}

function arr(v: unknown): any[]      { return Array.isArray(v) ? v : []; }
function bool(v: unknown): boolean   { return v === true; }
function clampInt(v: unknown, min: number, max: number): number {
  const n = typeof v === 'number' ? Math.round(v) : 0;
  return Math.max(min, Math.min(max, n));
}

function extractJsonObject(s: string): any | null {
  if (!s) return null;
  // Strip code fences if present.
  const cleaned = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  // Last-ditch: find the outermost {...}.
  const first = cleaned.indexOf('{');
  const last  = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch { return null; }
  }
  return null;
}
