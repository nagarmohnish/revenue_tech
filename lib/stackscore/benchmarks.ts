import type { BenchmarkFlow } from './types';

// Reference funnels — calibrated by hand against this scorer's rubric.
// They exist to give users a "you sit between X and Y" anchor.

export const BENCHMARK_FLOWS: BenchmarkFlow[] = [
  {
    name: 'Notion',
    steps: 2,
    score: 92,
    signature: 'landing → signup (free, no card)',
    highlight: 'Free tier collapses the funnel to a single decision. Card only later, when you upgrade.',
  },
  {
    name: 'Netflix',
    steps: 3,
    score: 90,
    signature: 'landing → plan select → checkout',
    highlight: 'Three steps. No interstitials. No upsells. Knows its visitor wants one decision, not five.',
  },
  {
    name: 'Spotify',
    steps: 4,
    score: 88,
    signature: 'landing → premium → plan → checkout',
    highlight: 'Bundle picker is a separate step but every option is priced before sign-up.',
  },
  {
    name: 'Linear',
    steps: 3,
    score: 88,
    signature: 'landing → pricing → signup',
    highlight: 'One CTA per tier. Price visible before any form fields.',
  },
  {
    name: 'ChatGPT Plus',
    steps: 3,
    score: 86,
    signature: 'pricing → login → Stripe checkout',
    highlight: 'Login gate before Stripe is the friction — but price + features are visible upfront.',
  },
  {
    name: 'Stripe Atlas',
    steps: 5,
    score: 84,
    signature: 'landing → pricing → signup → kyc → checkout',
    highlight: 'Necessarily longer (incorporation flow). Each step shows progress and total cost.',
  },
  {
    name: 'Vercel',
    steps: 3,
    score: 87,
    signature: 'pricing → plan → checkout',
    highlight: 'Usage-based pricing surfaced as concrete numbers, not "talk to us".',
  },
  {
    name: 'Shopify',
    steps: 4,
    score: 82,
    signature: 'pricing → trial signup → plan select → checkout',
    highlight: 'Trial-without-card upfront. Plan choice deferred until you have signal.',
  },
];

export function rankFlow(score: number): { position: number; total: number; closestTo: string } {
  const all = [...BENCHMARK_FLOWS.map((b) => ({ name: b.name, score: b.score })), { name: 'You', score }];
  all.sort((a, b) => b.score - a.score);
  const position = all.findIndex((x) => x.name === 'You') + 1;
  let closestTo = BENCHMARK_FLOWS[0].name;
  let bestDelta = Infinity;
  for (const b of BENCHMARK_FLOWS) {
    const d = Math.abs(b.score - score);
    if (d < bestDelta) { bestDelta = d; closestTo = b.name; }
  }
  return { position, total: all.length, closestTo };
}
