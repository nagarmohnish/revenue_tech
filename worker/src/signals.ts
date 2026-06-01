// Runs inside the browser context via page.evaluate.
// Returns StepSignals for the current page.

import type { Page } from 'playwright-core';
import type { StepSignals } from './types.js';

export async function extractSignals(page: Page, loadTimeMs: number): Promise<StepSignals> {
  const raw = await page.evaluate(() => {
    const text = (document.body?.innerText || '').replace(/\s+/g, ' ').slice(0, 30000);
    const lower = text.toLowerCase();

    // ── prices + currencies ───────────────────────────────────────────
    const priceRe = /[\$€£₹](\s?)(\d{1,5}(?:\.\d{1,2})?)/g;
    const pricePoints: number[] = [];
    const currencySet = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = priceRe.exec(text)) !== null) {
      currencySet.add(m[0].trim().charAt(0));
      const n = parseFloat(m[2]);
      if (Number.isFinite(n) && n > 0 && n < 100000) pricePoints.push(n);
    }
    const uniquePrices = Array.from(new Set(pricePoints)).sort((a, b) => a - b).slice(0, 12);

    // ── CTAs (visible, action-shaped) ────────────────────────────────
    const ACTION_RE = /^(start|get|try|sign\s*up|sign\s*in|log\s*in|buy|subscribe|upgrade|book|talk|contact|choose|select|continue|next|checkout|pay|confirm|go\s*pro|claim|join|begin)\b/i;
    const allClickables = Array.from(document.querySelectorAll('a, button, [role="button"]')) as HTMLElement[];
    const visibleClickables = allClickables.filter((el) => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (r.width < 20 || r.height < 14) return false;
      return true;
    });

    const ctas: Array<{ text: string; area: number; top: number; isPrimary: boolean }> = [];
    for (const el of visibleClickables) {
      const txt = (el.textContent || '').trim().replace(/\s+/g, ' ');
      if (!txt || txt.length > 60) continue;
      const cls = (el.getAttribute('class') || '').toLowerCase();
      const isPrimary = /(primary|btn-primary|cta|brand|accent|main)/.test(cls);
      const matchesAction = ACTION_RE.test(txt);
      if (!matchesAction && !isPrimary) continue;
      const r = el.getBoundingClientRect();
      ctas.push({ text: txt, area: r.width * r.height, top: r.top, isPrimary });
    }
    // Largest area wins as "primary" if multiple match.
    ctas.sort((a, b) => b.area - a.area);
    const primaryCtaText = ctas[0]?.text || null;
    const competingCtaTexts = ctas.slice(1, 8).map((c) => c.text);

    // ── forms ───────────────────────────────────────────────────────
    const inputs = Array.from(document.querySelectorAll('input, select, textarea')) as HTMLInputElement[];
    const visibleInputs = inputs.filter((el) => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (el.type === 'hidden') return false;
      return true;
    });
    const requiredFieldCount = visibleInputs.filter((el) => el.required || el.getAttribute('aria-required') === 'true').length;

    const fieldNames = visibleInputs.map((el) => {
      const n = (el.getAttribute('name') || el.getAttribute('id') || el.getAttribute('autocomplete') || el.getAttribute('placeholder') || '').toLowerCase();
      return n;
    });
    const fieldNamesJoin = fieldNames.join('|');

    const hasCardField =
      /\b(cc[-_ ]?number|card[-_ ]?number|cardnumber|ccnumber|card[-_ ]?num|cvv|cvc|cardexpiry|exp[-_ ]?(date|month|year))\b/.test(fieldNamesJoin) ||
      Array.from(document.querySelectorAll('input[autocomplete="cc-number"], input[name*="card" i]')).length > 0;

    const hasEmailField    = /\b(email|e-mail|user-email|login|username)\b/.test(fieldNamesJoin) || visibleInputs.some((el) => el.type === 'email');
    const hasPasswordField = visibleInputs.some((el) => el.type === 'password');
    const hasContinueAsGuest = /\b(continue\s*as\s*guest|guest\s*checkout|skip\s*sign[-\s]*up|no\s*thanks|maybe\s*later)\b/.test(lower);

    // ── trust + content ─────────────────────────────────────────────
    const paymentMethods: string[] = [];
    if (/\bstripe\b/.test(lower)) paymentMethods.push('Stripe');
    if (/\bpaypal\b/.test(lower)) paymentMethods.push('PayPal');
    if (/\bapple\s*pay\b/.test(lower)) paymentMethods.push('Apple Pay');
    if (/\bgoogle\s*pay\b/.test(lower)) paymentMethods.push('Google Pay');
    if (/\brazorpay\b/.test(lower)) paymentMethods.push('Razorpay');
    if (/\bupi\b/.test(lower)) paymentMethods.push('UPI');

    const hasSecurityBadges = /\b(ssl|256[-\s]?bit|pci[-\s]?dss|soc\s*2|gdpr|secure\s*(checkout|payment))\b/.test(lower);
    const hasGuarantee = /\b(money[-\s]back|cancel\s*any\s*time|no\s*questions\s*asked|free\s*to\s*cancel|14[-\s]day\s*refund|30[-\s]day\s*refund)\b/.test(lower);
    const hasFAQ = /\b(faq|frequently\s*asked|common\s*questions)\b/.test(lower);

    // ── iframes (payment providers) ─────────────────────────────────
    const frames = Array.from(document.querySelectorAll('iframe')) as HTMLIFrameElement[];
    let hasStripeIframe = false;
    let hasOtherPaymentIframe = false;
    for (const f of frames) {
      const src = (f.src || '').toLowerCase();
      const title = (f.title || '').toLowerCase();
      if (src.includes('stripe') || title.includes('stripe')) hasStripeIframe = true;
      if (/(adyen|braintree|checkout|hostedpayment|paypal|razorpay|cashfree)/i.test(src)) hasOtherPaymentIframe = true;
    }

    return {
      ctaCount: ctas.length,
      primaryCtaText,
      competingCtaTexts,
      formFieldCount: visibleInputs.length,
      requiredFieldCount,
      hasCardField,
      hasEmailField,
      hasPasswordField,
      hasContinueAsGuest,
      currencySymbols: Array.from(currencySet),
      pricePoints: uniquePrices,
      paymentMethods,
      hasSecurityBadges,
      hasGuarantee,
      hasFAQ,
      viewportHeight: document.documentElement.scrollHeight,
      hasStripeIframe,
      hasOtherPaymentIframe,
    };
  });

  return { ...raw, loadTimeMs };
}
