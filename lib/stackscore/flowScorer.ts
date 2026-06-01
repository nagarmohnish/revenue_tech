// Flow-level scorer.
//
// Four dimensions, 25 points each, total 100. Findings are per-step
// observations (good / warn / bad). Suggestions are concrete actions, derived
// from the same rules; Claude can add 1-3 more contextual ones downstream.

import type {
  DimensionResult, FlowReport, FlowStep, StepClass, StepFinding,
  StepSignals, Suggestion, TerminalReason, WalkResponse,
} from './types';
import { BENCHMARK_FLOWS, rankFlow } from './benchmarks';

// ─────────────────────────────────────────────────────────────────────────────
// Brevity (25): fewer steps = better, with a small penalty for excessive
// dead-end terminals (auth wall before pricing, etc.).
// ─────────────────────────────────────────────────────────────────────────────
function scoreBrevity(steps: FlowStep[], term: TerminalReason): DimensionResult {
  const count = steps.length;
  let points: number;
  if (count <= 3)      points = 25;
  else if (count === 4) points = 21;
  else if (count === 5) points = 17;
  else if (count === 6) points = 12;
  else                  points = 8;

  if (term === 'auth_wall' && countBeforeClass(steps, 'pricing') < 0) points = Math.max(0, points - 6);
  if (term === 'navigation_error') points = Math.max(0, points - 8);

  const detail =
    term === 'auth_wall'        ? `${count} step(s) — hit an auth wall before checkout could be reached` :
    term === 'payment_reached'  ? `${count} step(s) to a payment form — that is the funnel length your customer experiences` :
    term === 'success_page'     ? `${count} step(s) to confirmation (no payment-form gate detected)` :
    term === 'external_redirect'? `${count} step(s) before redirecting to an external payment provider` :
    term === 'max_steps'        ? `${count} step(s) — funnel may be even longer; reached our cap` :
    term === 'loop'             ? `${count} step(s) — the flow looped back on itself` :
    term === 'no_progress'      ? `${count} step(s) — no further purchase-intent CTA found` :
                                  `${count} step(s) walked`;
  return { key: 'brevity', label: 'Brevity', points, max: 25, detail };
}

function countBeforeClass(steps: FlowStep[], target: StepClass): number {
  return steps.findIndex((s) => s.classification === target);
}

// ─────────────────────────────────────────────────────────────────────────────
// Clarity (25): on each step the visitor should see ONE obvious next action.
// Penalize steps with >5 competing visible CTAs.
// ─────────────────────────────────────────────────────────────────────────────
function scoreClarity(steps: FlowStep[]): DimensionResult {
  if (steps.length === 0) return { key: 'clarity', label: 'Clarity', points: 0, max: 25, detail: 'No steps captured' };
  let cumulative = 0;
  let noisyCount = 0;
  for (const s of steps) {
    const ctas = s.signals.ctaCount;
    if (ctas <= 4) cumulative += 1;
    else if (ctas <= 8) { cumulative += 0.6; noisyCount += 1; }
    else { cumulative += 0.25; noisyCount += 1; }
  }
  const ratio = cumulative / steps.length;
  const points = Math.round(ratio * 25);
  const detail = noisyCount === 0
    ? 'Every step had a clear primary CTA'
    : `${noisyCount} step(s) had 6+ competing CTAs on screen`;
  return { key: 'clarity', label: 'Clarity', points, max: 25, detail };
}

// ─────────────────────────────────────────────────────────────────────────────
// Transparency (25): was price visible BEFORE any form? Did the recurring
// nature get stated before card collection? No surprise costs at checkout?
// ─────────────────────────────────────────────────────────────────────────────
function scoreTransparency(steps: FlowStep[]): DimensionResult {
  if (steps.length === 0) return { key: 'transparency', label: 'Cost transparency', points: 0, max: 25, detail: 'No steps captured' };
  let points = 0;
  let parts: string[] = [];

  // 12 pts: price visible *before* any step that requires fields.
  const firstFormStepIdx = steps.findIndex((s) => s.signals.formFieldCount >= 2);
  const firstPriceStepIdx = steps.findIndex((s) => s.signals.pricePoints.length > 0);
  if (firstPriceStepIdx >= 0 && (firstFormStepIdx < 0 || firstPriceStepIdx <= firstFormStepIdx)) {
    points += 12;
    parts.push('price visible before forms');
  } else if (firstPriceStepIdx >= 0) {
    points += 4;
    parts.push('price visible only after a form-heavy step');
  } else {
    parts.push('no price ever surfaced');
  }

  // 8 pts: price consistent across steps (max-min spread / max <= 0.1).
  const allPrices = steps.flatMap((s) => s.signals.pricePoints);
  if (allPrices.length >= 2) {
    const max = Math.max(...allPrices);
    const min = Math.min(...allPrices.filter((p) => p > 0));
    if (max > 0 && (max - min) / max <= 0.3) { points += 8; parts.push('prices consistent across steps'); }
    else { parts.push('prices drift between steps (possible surprise costs)'); }
  } else if (allPrices.length === 1) {
    points += 6;
    parts.push('single price shown end-to-end');
  }

  // 5 pts: recurring nature stated alongside price (per/mo, /yr).
  const recurringMentioned = steps.some((s) => /\/(mo|month|yr|year)/.test((s.title || '') + ' ' + (s.signals.primaryCtaText || '')));
  // We don't have body text here, so we infer from CTA + title only — be lenient.
  if (recurringMentioned || allPrices.length === 0) {
    points += 3;
  } else {
    points += 5;
    parts.push('recurring cadence implied');
  }

  return { key: 'transparency', label: 'Cost transparency', points: Math.min(25, points), max: 25, detail: parts.join(' · ') };
}

// ─────────────────────────────────────────────────────────────────────────────
// Trust (25): security + payment-method signal, cancellation, no forced
// sign-up before pricing, no forced card before trial info.
// ─────────────────────────────────────────────────────────────────────────────
function scoreTrust(steps: FlowStep[]): DimensionResult {
  if (steps.length === 0) return { key: 'trust', label: 'Trust', points: 0, max: 25, detail: 'No steps captured' };
  let points = 0;
  const parts: string[] = [];

  // 6 pts: payment methods named somewhere in the flow.
  const anyMethod = steps.some((s) => s.signals.paymentMethods.length > 0);
  if (anyMethod) { points += 6; parts.push('payment methods named in-flow'); }
  else { parts.push('no payment-method names seen'); }

  // 5 pts: a security signal on the step that collects fields.
  const fieldStep = steps.find((s) => s.signals.formFieldCount >= 2);
  if (fieldStep?.signals.hasSecurityBadges) { points += 5; parts.push('security signal on the form step'); }
  else if (fieldStep) { parts.push('no security signal on the form step'); }

  // 5 pts: guarantee / cancel-anytime language anywhere.
  if (steps.some((s) => s.signals.hasGuarantee)) { points += 5; parts.push('cancellation language present'); }
  else { parts.push('no cancellation language visible'); }

  // 5 pts penalty-style: forced signup before pricing.
  const signupIdx = steps.findIndex((s) => s.classification === 'signup' || s.classification === 'auth_wall');
  const pricingIdx = steps.findIndex((s) => s.classification === 'pricing' || s.signals.pricePoints.length >= 2);
  if (signupIdx >= 0 && pricingIdx >= 0 && pricingIdx <= signupIdx) {
    points += 5;
    parts.push('pricing shown before signup');
  } else if (signupIdx >= 0 && pricingIdx < 0) {
    parts.push('signup required before pricing was ever shown');
  } else {
    points += 3;
  }

  // 4 pts: no card field requested before a trial-context step.
  const cardIdx = steps.findIndex((s) => s.signals.hasCardField);
  const trialIdx = steps.findIndex((s) =>
    /free|trial|try/i.test((s.title || '') + ' ' + (s.signals.primaryCtaText || '')) ||
    s.signals.hasGuarantee
  );
  if (cardIdx < 0) {
    points += 4;
  } else if (trialIdx >= 0 && trialIdx <= cardIdx) {
    points += 4;
    parts.push('trial context shown before card');
  } else {
    parts.push('card requested with no trial context');
  }

  return { key: 'trust', label: 'Trust', points: Math.min(25, points), max: 25, detail: parts.join(' · ') };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-step findings: what was good / what to watch
// ─────────────────────────────────────────────────────────────────────────────
function buildFindings(steps: FlowStep[]): StepFinding[] {
  const out: StepFinding[] = [];
  for (const s of steps) {
    const sig = s.signals;

    if (sig.ctaCount >= 9) {
      out.push({ stepIndex: s.index, severity: 'warn', title: 'Too many competing CTAs', body: `${sig.ctaCount} visible buttons/links here. Visitors freeze when there is no obvious next action.` });
    }
    if (sig.formFieldCount >= 6 && s.classification !== 'checkout' && s.classification !== 'payment') {
      out.push({ stepIndex: s.index, severity: 'warn', title: 'Long form before the buyer is committed', body: `${sig.formFieldCount} fields visible. Long forms convert worse than progressive disclosure.` });
    }
    if (sig.hasCardField && !steps.slice(0, s.index).some((p) => p.signals.hasGuarantee)) {
      out.push({ stepIndex: s.index, severity: 'bad', title: 'Card requested without cancellation language', body: 'A "cancel anytime" or money-back line earlier in the flow reduces card abandonment.' });
    }
    if (s.classification === 'auth_wall') {
      out.push({ stepIndex: s.index, severity: 'bad', title: 'Auth wall reached', body: 'The flow ends here for visitors without an account. Add "continue as guest" or move signup after pricing.' });
    }
    if (s.signals.loadTimeMs > 4000) {
      out.push({ stepIndex: s.index, severity: 'warn', title: 'Slow step', body: `Loaded in ${Math.round(s.signals.loadTimeMs / 100) / 10}s — > 4s adds noticeable drop-off.` });
    }
    if (sig.pricePoints.length === 0 && s.classification === 'pricing') {
      out.push({ stepIndex: s.index, severity: 'bad', title: 'Pricing page with no visible price', body: 'Pricing/plans is in the URL or page title but no currency-denominated price was detected.' });
    }
    if (sig.primaryCtaText && /^(get\s+started|sign\s*up)\b/i.test(sig.primaryCtaText) && s.classification === 'pricing') {
      out.push({ stepIndex: s.index, severity: 'warn', title: 'Generic CTA on pricing page', body: '"Get started" works on landing pages; on a pricing page, "Choose Pro" or "Start free trial" converts better.' });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggestions: deterministic + actionable
// ─────────────────────────────────────────────────────────────────────────────
function buildSuggestions(steps: FlowStep[], term: TerminalReason, dims: DimensionResult[]): Suggestion[] {
  const out: Suggestion[] = [];

  if (steps.length >= 6) {
    out.push({
      scope: 'flow', dimension: 'brevity', source: 'rule',
      title: 'Cut at least one step',
      body: `Your funnel runs ${steps.length} steps. Three to four is the working range for most self-serve SaaS. Audit each interstitial — does it carry its weight, or is it a vanity step?`,
      exemplar: { company: 'Netflix', note: 'Three steps from landing to checkout, no upsells in between.' },
    });
  }

  // Pricing-before-signup check.
  const signupIdx = steps.findIndex((s) => s.classification === 'signup' || s.classification === 'auth_wall');
  const pricingIdx = steps.findIndex((s) => s.classification === 'pricing' || s.signals.pricePoints.length >= 2);
  if (signupIdx >= 0 && pricingIdx >= 0 && signupIdx < pricingIdx) {
    out.push({
      scope: 'flow', dimension: 'transparency', source: 'rule',
      title: 'Show prices before signup',
      body: 'You ask the visitor to create an account before they see prices. A meaningful share will bounce. Surface the pricing card on the page before the signup form.',
      exemplar: { company: 'Linear', note: 'Pricing visible from the homepage; signup is a one-step gate after the visitor has picked a tier.' },
    });
  }

  // Card-before-trial-info.
  const cardIdx = steps.findIndex((s) => s.signals.hasCardField);
  const guaranteeIdx = steps.findIndex((s) => s.signals.hasGuarantee);
  if (cardIdx >= 0 && (guaranteeIdx < 0 || guaranteeIdx > cardIdx)) {
    out.push({
      scope: 'flow', dimension: 'trust', source: 'rule',
      title: 'Add "cancel anytime" before the card field',
      body: 'A card request lands harder when the visitor has not been told they can cancel. Move the guarantee line above the card form, not below it.',
      exemplar: { company: 'Shopify', note: '"Cancel anytime, no setup fees" sits directly above the checkout fields.' },
    });
  }

  // No payment methods named anywhere.
  if (!steps.some((s) => s.signals.paymentMethods.length > 0)) {
    out.push({
      scope: 'flow', dimension: 'trust', source: 'rule',
      title: 'Name your payment methods in the flow',
      body: 'Logos for Stripe / PayPal / Apple Pay / UPI near the CTA cut abandonment. Visitors trust familiar names.',
    });
  }

  // Auth wall = critical.
  if (term === 'auth_wall') {
    out.push({
      scope: 'flow', dimension: 'brevity', source: 'rule',
      title: 'Add a guest-checkout path',
      body: 'Your funnel currently dead-ends at an auth wall. Either add "continue as guest", or let visitors pick a plan first and create the account after.',
    });
  }

  // Long form on a non-checkout step.
  for (const s of steps) {
    if (s.signals.formFieldCount >= 6 && s.classification !== 'checkout' && s.classification !== 'payment') {
      out.push({
        scope: 'step', stepIndex: s.index, dimension: 'clarity', source: 'rule',
        title: `Shorten the form on step ${s.index + 1}`,
        body: `${s.signals.formFieldCount} fields is a lot for a non-checkout step. Split it across steps, or move optional fields to a "complete profile later" CTA after the conversion.`,
      });
      break;
    }
  }

  // Clarity dimension low → blame the noisy step.
  const clarity = dims.find((d) => d.key === 'clarity');
  if (clarity && clarity.points < 18) {
    const noisy = steps.find((s) => s.signals.ctaCount >= 9);
    if (noisy) {
      out.push({
        scope: 'step', stepIndex: noisy.index, dimension: 'clarity', source: 'rule',
        title: `Reduce CTA noise on step ${noisy.index + 1}`,
        body: `${noisy.signals.ctaCount} CTAs on one page leaves the buyer without an obvious next action. Pick one primary and demote the rest to secondary or tertiary.`,
      });
    }
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compose the full report
// ─────────────────────────────────────────────────────────────────────────────
export function scoreWalk(walk: WalkResponse): FlowReport {
  const dims = [
    scoreBrevity(walk.steps, walk.terminatedReason),
    scoreClarity(walk.steps),
    scoreTransparency(walk.steps),
    scoreTrust(walk.steps),
  ];
  const score = dims.reduce((a, d) => a + d.points, 0);
  const findings = buildFindings(walk.steps);
  const suggestions = buildSuggestions(walk.steps, walk.terminatedReason, dims);
  const rank = rankFlow(score);

  return {
    startUrl: walk.startUrl,
    hostname: walk.hostname,
    score,
    dimensions: dims,
    findings,
    suggestions,
    steps: walk.steps,
    terminatedReason: walk.terminatedReason,
    benchmarks: BENCHMARK_FLOWS,
    rank,
    generatedAt: new Date().toISOString(),
    durationMs: walk.durationMs,
  };
}
