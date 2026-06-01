// Deterministic scorer. Each dimension caps at 25 points; total = 100.
// Suggestions are generated rule-by-rule (deterministic) and can be augmented
// by Claude downstream — see suggestions.ts.

import { Signals, DimensionResult, DimensionKey, Suggestion, Scorecard } from './types';
import { BENCHMARKS, rankAgainstBenchmarks } from './benchmarks';

interface Rule {
  rule: string;
  weight: number;
  test: (s: Signals) => boolean;
  detail?: (s: Signals) => string | undefined;
  fixTitle: string;
  fixBody: string;
  exemplar?: { company: string; note: string };
}

const CLARITY_RULES: Rule[] = [
  {
    rule: 'Prices are visible on the page',
    weight: 8,
    test: (s) => s.pricePoints.length >= 1,
    detail: (s) => (s.pricePoints.length ? `${s.pricePoints.length} price point(s) detected` : 'No prices detected'),
    fixTitle: 'Show real numbers, not "Contact us"',
    fixBody: 'At least one tier on a public pricing page should have a concrete number. Hiding all pricing pushes self-serve buyers to a competitor.',
    exemplar: { company: 'Stripe', note: 'Every fee is disclosed inline like a tax table.' },
  },
  {
    rule: 'At least one currency is shown',
    weight: 4,
    test: (s) => s.currencySymbols.length >= 1,
    fixTitle: 'Show a currency symbol next to the price',
    fixBody: 'Bare numbers ("9 / month") create cognitive friction. Always pair the number with a symbol.',
  },
  {
    rule: 'Plan tiers are detectable',
    weight: 5,
    test: (s) => s.planCount >= 2,
    detail: (s) => `${s.planCount} tier(s) detected`,
    fixTitle: 'Render plan tiers as distinct cards',
    fixBody: 'Use visually distinct cards with a heading, price, and feature list per tier. Toggles and tables work too, but cards convert highest on mobile.',
    exemplar: { company: 'Linear', note: 'Three tiers, two comparison columns, one CTA per tier — zero noise.' },
  },
  {
    rule: 'FAQ section is present',
    weight: 5,
    test: (s) => s.hasFAQ,
    fixTitle: 'Add an FAQ below the pricing cards',
    fixBody: 'The five most common deal-breaker questions (cancel anytime, prorating, refunds, tax, plan switching) should be answered inline — not in a help center.',
  },
  {
    rule: 'Multiple currencies offered (international)',
    weight: 3,
    test: (s) => s.currencySymbols.length >= 2,
    fixTitle: 'Offer at least one secondary currency',
    fixBody: 'If you sell outside one country, an INR/EUR/GBP price selector removes the mental math step.',
  },
];

const CONVERSION_RULES: Rule[] = [
  {
    rule: 'A plan is highlighted as "Most popular" or "Recommended"',
    weight: 8,
    test: (s) => s.hasHighlightedPlan,
    fixTitle: 'Highlight one plan as the recommended choice',
    fixBody: 'A single visually-anchored tier (border + badge) increases conversion to that tier by 20–40% in most A/B tests. Pick the plan you want most people on.',
    exemplar: { company: 'Notion', note: 'The Plus tier is bordered and badged "Most popular" — and that\'s the tier most users land on.' },
  },
  {
    rule: 'Free trial or freemium exists',
    weight: 7,
    test: (s) => s.hasTrial || s.hasFreemium,
    fixTitle: 'Add a free trial or a free-forever tier',
    fixBody: 'A "no credit card" trial of 14–30 days is the lowest-friction self-serve funnel. A free-forever tier with a sensible throttle works even better for products with viral mechanics.',
    exemplar: { company: 'Slack', note: 'Generous free tier that throttles only when you outgrow it — pressure to upgrade is organic.' },
  },
  {
    rule: 'Monthly / annual toggle present',
    weight: 5,
    test: (s) => s.hasAnnualMonthlyToggle,
    fixTitle: 'Add a monthly/annual toggle',
    fixBody: 'Show both prices on one card. Default the toggle to annual so the saving is the first thing the visitor sees.',
  },
  {
    rule: 'Annual discount is surfaced (e.g. "save 20%")',
    weight: 5,
    test: (s) => s.hasAnnualDiscount,
    fixTitle: 'Tell visitors how much annual saves',
    fixBody: 'Don\'t make the visitor do the math. Show "save 20%" or "2 months free" right next to the annual price.',
    exemplar: { company: 'Figma', note: 'Annual is shown both as a discounted price and as a percentage save.' },
  },
];

const FLEXIBILITY_RULES: Rule[] = [
  {
    rule: '3 or more plan tiers',
    weight: 8,
    test: (s) => s.planCount >= 3,
    fixTitle: 'Offer at least three tiers',
    fixBody: 'Two-tier pages flatten the buyer journey. Three lets you anchor (the cheap one), recommend (the middle), and reserve headroom (the enterprise/contact).',
  },
  {
    rule: 'Free or trial entry point',
    weight: 4,
    test: (s) => s.hasFree || s.hasTrial,
    fixTitle: 'Provide a free or trial entry point',
    fixBody: 'A "$0 to start" entry slot collapses the first decision — the visitor commits time, not money.',
  },
  {
    rule: 'Enterprise / contact-sales path',
    weight: 5,
    test: (s) => s.hasEnterprise,
    fixTitle: 'Add an enterprise tier with "Contact sales"',
    fixBody: 'Even if you\'re indie, an "Enterprise" card signals headroom. It also gives larger buyers a place to land without abandoning the page.',
  },
  {
    rule: 'Multiple CTAs (one per tier minimum)',
    weight: 4,
    test: (s) => s.ctaCount >= 3,
    detail: (s) => `${s.ctaCount} CTA(s) detected`,
    fixTitle: 'Give every tier its own CTA button',
    fixBody: 'Each tier should have an action — "Start free", "Get Pro", "Contact sales". One global CTA forces the buyer to scroll back up.',
  },
  {
    rule: 'Cancellation / no-lock-in language',
    weight: 4,
    test: (s) => s.hasCancellationMessaging,
    fixTitle: 'Say "Cancel anytime" out loud',
    fixBody: 'Even if it\'s implied, the line "Cancel anytime, no lock-in" lifts conversion. Buyers fear traps more than they fear price.',
  },
];

const TRUST_RULES: Rule[] = [
  {
    rule: 'Payment methods are shown',
    weight: 7,
    test: (s) => s.paymentMethods.length >= 1,
    detail: (s) => (s.paymentMethods.length ? s.paymentMethods.join(' · ') : 'No payment methods detected'),
    fixTitle: 'Show the payment methods you accept',
    fixBody: 'Logos for Stripe / PayPal / Apple Pay / UPI near the checkout button reduce abandonment by signaling familiarity. The fewer logos you show, the more trust you ask for in advance.',
  },
  {
    rule: 'Security / compliance signaled',
    weight: 5,
    test: (s) => s.hasSecurityBadges,
    fixTitle: 'Surface a security signal near the price',
    fixBody: 'SSL/PCI/SOC 2 badges or "Secure checkout" copy near the CTA is worth a small but real percentage on B2B funnels.',
  },
  {
    rule: 'Testimonials or customer logos present',
    weight: 6,
    test: (s) => s.hasTestimonials || s.hasLogos,
    fixTitle: 'Add a logo wall or one good testimonial',
    fixBody: 'One specific quote with a named customer beats five vague ones. A logo wall works if you have recognizable names; otherwise lead with a testimonial.',
  },
  {
    rule: 'Guarantee or money-back language',
    weight: 4,
    test: (s) => s.hasGuarantee,
    fixTitle: 'Offer a money-back guarantee in writing',
    fixBody: 'A 14- or 30-day guarantee removes the last objection. The actual refund rate stays vanishingly small in self-serve SaaS.',
  },
  {
    rule: 'Primary CTA reads as action ("Start", "Get", "Try")',
    weight: 3,
    test: (s) => !!s.primaryCtaText && /^(start|get|try|sign\s*up|subscribe|upgrade|book|talk|join|begin|claim)/i.test(s.primaryCtaText),
    fixTitle: 'Use action-first CTA copy',
    fixBody: 'Start with the verb. "Start for free" outperforms "Free Plan". "Get Pro" outperforms "Pro $49".',
  },
];

const DIMENSIONS: Array<{ key: DimensionKey; label: string; rules: Rule[] }> = [
  { key: 'clarity',     label: 'Clarity',     rules: CLARITY_RULES },
  { key: 'conversion',  label: 'Conversion',  rules: CONVERSION_RULES },
  { key: 'flexibility', label: 'Flexibility', rules: FLEXIBILITY_RULES },
  { key: 'trust',       label: 'Trust',       rules: TRUST_RULES },
];

export function scoreSignals(signals: Signals, inputKind: 'url' | 'screenshot'): Scorecard {
  const dimensions: DimensionResult[] = DIMENSIONS.map(({ key, label, rules }) => {
    const hits = rules.map((r) => ({
      rule: r.rule,
      pass: r.test(signals),
      weight: r.weight,
      detail: r.detail?.(signals),
    }));
    const points = hits.reduce((acc, h) => acc + (h.pass ? h.weight : 0), 0);
    const max    = rules.reduce((acc, r) => acc + r.weight, 0);
    return { key, label, points, max, hits };
  });
  const score = dimensions.reduce((a, d) => a + d.points, 0);

  // Rule-derived suggestions (deterministic).
  const suggestions: Suggestion[] = [];
  for (const { key, rules } of DIMENSIONS) {
    for (const r of rules) {
      if (!r.test(signals)) {
        suggestions.push({
          dimension: key,
          title: r.fixTitle,
          body: r.fixBody,
          exemplar: r.exemplar,
          source: 'rule',
        });
      }
    }
  }

  const rank = rankAgainstBenchmarks(score);

  return {
    url: signals.url,
    hostname: signals.hostname,
    inputKind,
    score,
    dimensions,
    suggestions,
    signals,
    benchmarks: BENCHMARKS,
    rank,
    generatedAt: new Date().toISOString(),
  };
}
