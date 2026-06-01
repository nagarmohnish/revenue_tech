import { Benchmark } from './types';

// Hand-curated reference set. Scores are calibrated against the same heuristic
// engine in scorer.ts. They are intentionally approximate — they exist to give
// users a credible "you are between Notion and Vercel" anchor, not to claim
// objective truth about each company.

export const BENCHMARKS: Benchmark[] = [
  {
    name: 'Stripe',
    url: 'https://stripe.com/pricing',
    score: 94,
    dimensions: { clarity: 24, conversion: 23, flexibility: 24, trust: 23 },
    highlight: 'Per-transaction pricing read like a tax table — every fee disclosed inline. No hidden tiers.',
  },
  {
    name: 'Notion',
    url: 'https://www.notion.so/pricing',
    score: 92,
    dimensions: { clarity: 23, conversion: 24, flexibility: 22, trust: 23 },
    highlight: 'Free tier carries 90% of the value. Annual toggle saves 20%, surfaced as a number not a slogan.',
  },
  {
    name: 'Figma',
    url: 'https://www.figma.com/pricing',
    score: 90,
    dimensions: { clarity: 23, conversion: 22, flexibility: 22, trust: 23 },
    highlight: 'Per-editor pricing decoupled from viewers — the gate matches the value unit.',
  },
  {
    name: 'Linear',
    url: 'https://linear.app/pricing',
    score: 89,
    dimensions: { clarity: 24, conversion: 22, flexibility: 20, trust: 23 },
    highlight: 'Three tiers, two columns of comparison, one CTA per tier. Zero noise.',
  },
  {
    name: 'Vercel',
    url: 'https://vercel.com/pricing',
    score: 87,
    dimensions: { clarity: 22, conversion: 22, flexibility: 23, trust: 20 },
    highlight: 'Usage-based dimensions exposed transparently — bandwidth, function exec, builds — each priced separately.',
  },
  {
    name: 'Shopify',
    url: 'https://www.shopify.com/pricing',
    score: 84,
    dimensions: { clarity: 22, conversion: 21, flexibility: 21, trust: 20 },
    highlight: 'Annual discount surfaced as a percent and a dollar amount. Money-back guarantee on every plan.',
  },
  {
    name: 'Slack',
    url: 'https://slack.com/pricing',
    score: 86,
    dimensions: { clarity: 22, conversion: 22, flexibility: 22, trust: 20 },
    highlight: 'Generous free tier that throttles only when you outgrow it. Upgrade pressure is organic.',
  },
  {
    name: 'Netflix',
    url: 'https://help.netflix.com/en/node/24926',
    score: 82,
    dimensions: { clarity: 23, conversion: 19, flexibility: 21, trust: 19 },
    highlight: 'Three tiers, no annual toggle, no friction. Knows its customer wants one decision, not five.',
  },
  {
    name: 'Spotify',
    url: 'https://www.spotify.com/premium',
    score: 84,
    dimensions: { clarity: 22, conversion: 22, flexibility: 21, trust: 19 },
    highlight: 'Bundle pricing (Individual / Duo / Family / Student) maps cleanly onto household reality.',
  },
  {
    name: 'OpenAI ChatGPT',
    url: 'https://openai.com/chatgpt/pricing',
    score: 81,
    dimensions: { clarity: 21, conversion: 21, flexibility: 19, trust: 20 },
    highlight: 'Single-product clarity. Plus vs Team vs Enterprise maps to who is paying.',
  },
];

export function rankAgainstBenchmarks(userScore: number): {
  position: number; total: number; closestTo: string; median: number;
} {
  const all = [...BENCHMARKS.map((b) => ({ name: b.name, score: b.score })), { name: 'You', score: userScore }];
  all.sort((a, b) => b.score - a.score);
  const position = all.findIndex((x) => x.name === 'You') + 1;

  // Closest absolute-distance benchmark (excluding "You" itself).
  let closestTo = BENCHMARKS[0].name;
  let bestDelta = Infinity;
  for (const b of BENCHMARKS) {
    const d = Math.abs(b.score - userScore);
    if (d < bestDelta) { bestDelta = d; closestTo = b.name; }
  }

  const sorted = [...BENCHMARKS.map((b) => b.score)].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);

  return { position, total: all.length, closestTo, median };
}
