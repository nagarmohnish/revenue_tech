import Stripe from 'stripe';
import { env } from './env';

let _stripe: Stripe | null = null;

export function stripeConfigured() {
  return !!env.stripeSecret;
}

export function stripe(): Stripe {
  if (!env.stripeSecret) throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY.');
  if (!_stripe) _stripe = new Stripe(env.stripeSecret, { apiVersion: '2024-11-20.acacia' });
  return _stripe;
}

export function stripePriceForPlan(plan: 'starter' | 'growth') {
  if (plan === 'starter') return env.stripeStarterPrice;
  if (plan === 'growth') return env.stripeGrowthPrice;
  return '';
}

export function stripeTopupPrice() {
  return env.stripeTopupPrice;
}
