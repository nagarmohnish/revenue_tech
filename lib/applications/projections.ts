// Deterministic revenue math. We refuse to delegate this to the LLM — it makes
// arithmetic mistakes and the projections need to add up under scrutiny.
//
// Method: convert their stated call-volume estimate into a customer count
// using a per-customer-call assumption that scales with the volume band,
// then blend tier prices by an assumed mix.

import type { ApplicationInput, VolumeEstimate } from './types';
import type { PricingTier, RevenueScenario } from './planTypes';

// Mid-point of each volume band (calls / month).
const VOLUME_MID: Record<VolumeEstimate, number> = {
  lt_100:   50,
  '100_1k': 500,
  '1k_10k': 5_000,
  '10k_100k': 50_000,
  gt_100k:  250_000,
};

// Assumed calls per active customer per month. Bigger volumes = lighter usage
// per customer because the customer base widens.
const CALLS_PER_CUSTOMER: Record<VolumeEstimate, number> = {
  lt_100:    20,
  '100_1k':  50,
  '1k_10k':  100,
  '10k_100k': 200,
  gt_100k:   300,
};

// Mix of tier adoption (low / mid / top tier).
const TIER_MIX = [0.6, 0.3, 0.1];

function parseDollarPrice(s: string): number {
  // Accepts "$29/mo", "$199 / month", "Free", "Custom", "$9 / pack".
  if (!s) return 0;
  const m = s.match(/\$\s*([\d.]+)/);
  if (!m) return 0;
  return parseFloat(m[1]);
}

function blendedArpu(tiers: PricingTier[]): number {
  // Pad missing tiers with last seen.
  const prices = tiers.slice(0, 3).map((t) => parseDollarPrice(t.price));
  while (prices.length < 3) prices.push(prices[prices.length - 1] || 0);
  return prices[0] * TIER_MIX[0] + prices[1] * TIER_MIX[1] + prices[2] * TIER_MIX[2];
}

export function computeProjections(input: ApplicationInput, tiers: PricingTier[]) {
  const mid           = VOLUME_MID[input.volumeEstimate];
  const callsPerUser  = CALLS_PER_CUSTOMER[input.volumeEstimate];
  const expectedCust  = Math.max(1, Math.round(mid / callsPerUser));
  const arpu          = blendedArpu(tiers);

  const make = (label: string, multiplier: number, assumption: string): RevenueScenario => {
    const customers = Math.max(1, Math.round(expectedCust * multiplier));
    const mrr       = Math.round(customers * arpu);
    return { label, customers, arpu: Math.round(arpu * 100) / 100, mrr, arr: mrr * 12, assumption };
  };

  return {
    pessimistic: make('Pessimistic', 0.4, '40% of stated volume converts; lower-tier mix.'),
    expected:    make('Expected',    1.0, 'Stated volume holds; 60% Starter / 30% Growth / 10% Top mix.'),
    optimistic:  make('Optimistic',  2.0, 'Volume doubles after launch; same tier mix.'),
    note: `ARPU $${arpu.toFixed(2)} weighted across tiers (60/30/10 mix). Customer count derived from ${mid.toLocaleString()} calls/month ÷ ${callsPerUser} calls/customer.`,
  };
}
