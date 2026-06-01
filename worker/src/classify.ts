// Classify a step from its URL + signals. Heuristic, deterministic.

import type { StepClass, StepSignals } from './types.js';

export function classify(url: string, signals: StepSignals, isFirstStep: boolean): StepClass {
  const u = url.toLowerCase();
  const path = (() => { try { return new URL(url).pathname.toLowerCase(); } catch { return ''; } })();

  // Success: thank-you / confirmation pages.
  if (/\/(success|thank[-_]?you|complete|done|confirmation|order[-_]?complete|receipt)\b/.test(path) ||
      /\?(.*&)?(success=true|status=success)\b/.test(u)) {
    return 'success';
  }

  // Payment: card field visible, Stripe iframe present, or path-based.
  if (signals.hasCardField || signals.hasStripeIframe || signals.hasOtherPaymentIframe ||
      /\/(payment|pay|billing|card)\b/.test(path)) {
    return 'payment';
  }

  // Auth wall: password field shown, no checkout fields, no obvious skip.
  if (signals.hasPasswordField && !signals.hasContinueAsGuest && signals.pricePoints.length === 0) {
    return 'auth_wall';
  }

  // Checkout: form-heavy + we have price context, but no card field yet.
  if (signals.formFieldCount >= 3 && signals.pricePoints.length >= 1 && !signals.hasPasswordField) {
    return 'checkout';
  }

  // Signup: email + password fields are dominant.
  if (signals.hasEmailField && signals.hasPasswordField && signals.formFieldCount <= 6) {
    return 'signup';
  }

  // Pricing: many prices visible (2+ distinct), or URL says so.
  if (signals.pricePoints.length >= 2 || /\/(pricing|plans|subscribe)\b/.test(path)) {
    return 'pricing';
  }

  // Plan detail: single price, plan-shaped.
  if (signals.pricePoints.length === 1 && /\/(plan|tier|product|item)\b/.test(path)) {
    return 'plan_detail';
  }

  if (isFirstStep) return 'landing';
  return 'unknown';
}
