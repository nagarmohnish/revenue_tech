export type ClientCount     = 'lt_5' | '5_25' | '25_100' | 'gt_100';
export type ChargingMethod  = 'none' | 'manual_invoice' | 'stripe' | 'paypal' | 'razorpay' | 'other' | 'mixed';
export type PayoutMethod    = 'not_setup' | 'stripe' | 'paypal' | 'wire' | 'razorpay' | 'other';
export type Timeline        = 'week' | 'month' | 'quarter' | 'exploring';
export type RoadmapStatus   = 'new' | 'scoping' | 'contacted' | 'building' | 'live' | 'declined';

export interface RoadmapInput {
  // Contact
  name: string;
  email: string;
  company: string;
  role?: string;

  // Company
  website: string;
  agentsSummary: string;
  agentCount: number;
  clientCount: ClientCount;

  // Billing now
  pricingNow: string;
  chargingMethod: ChargingMethod;
  chargingOther?: string;
  payoutMethod: PayoutMethod;
  payoutOther?: string;

  // Tech
  stack: string;
  aiTools: string;
  integrations?: string;
  docLinks?: string;

  // Concierge
  shareableCreds?: string;
  timeline: Timeline;
  notes?: string;
}

export const CLIENT_COUNT_LABELS: Record<ClientCount, string> = {
  lt_5:    'Fewer than 5 clients',
  '5_25':  '5–25 clients',
  '25_100': '25–100 clients',
  gt_100:  'More than 100 clients',
};

export const CHARGING_LABELS: Record<ChargingMethod, string> = {
  none:           'Not charging yet',
  manual_invoice: 'Manual invoices (PDF + bank transfer)',
  stripe:         'Stripe',
  paypal:         'PayPal',
  razorpay:       'Razorpay',
  other:          'Other',
  mixed:          'Mixed — different per client',
};

export const PAYOUT_LABELS: Record<PayoutMethod, string> = {
  not_setup: 'Not set up yet',
  stripe:    'Stripe → bank',
  paypal:    'PayPal',
  wire:      'Wire transfer',
  razorpay:  'Razorpay',
  other:     'Other',
};

export const TIMELINE_LABELS: Record<Timeline, string> = {
  week:      'This week',
  month:     'This month',
  quarter:   'This quarter',
  exploring: 'Just exploring',
};
