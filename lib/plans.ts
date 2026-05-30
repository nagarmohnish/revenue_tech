export type Plan = 'trial' | 'starter' | 'growth' | 'scale';

export const PLAN_ORDER: Plan[] = ['trial', 'starter', 'growth', 'scale'];

export interface PlanConfig {
  id: Plan;
  name: string;
  price_usd: number | null; // null = free or custom
  price_inr: number | null;
  credits: number;
  surfaced: boolean; // shown in MVP UI
  description: string;
}

export const PLANS: Record<Plan, PlanConfig> = {
  trial:   { id: 'trial',   name: 'Trial',   price_usd: 0,    price_inr: 0,     credits: 100,   surfaced: true, description: 'One-time grant on signup.' },
  starter: { id: 'starter', name: 'Starter', price_usd: 49,   price_inr: 3999,  credits: 500,   surfaced: true, description: 'For solo operators just getting started.' },
  growth:  { id: 'growth',  name: 'Growth',  price_usd: 199,  price_inr: 15999, credits: 2500,  surfaced: true, description: 'Unlocks PostFlwo, Bekbone, AEO Optimizer.' },
  scale:   { id: 'scale',   name: 'Scale',   price_usd: 599,  price_inr: 49999, credits: 10000, surfaced: false, description: 'Teams & higher volume.' },
};

export const TOPUP = {
  standard: { id: 'standard', credits: 500, price_usd: 9, price_inr: 749, label: 'Standard top-up' },
};

export function planMeetsRequirement(current: Plan, allowedOn: string[]): boolean {
  return allowedOn.includes(current);
}

export function minPlanFromList(allowedOn: string[]): Plan {
  for (const p of PLAN_ORDER) {
    if (allowedOn.includes(p)) return p;
  }
  return 'growth';
}
