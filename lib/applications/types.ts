export type Lifecycle      = 'idea' | 'building' | 'live_no_billing' | 'live_with_billing';
export type VolumeEstimate = 'lt_100' | '100_1k' | '1k_10k' | '10k_100k' | 'gt_100k';
export type BillingPref    = 'prepaid' | 'usage' | 'both' | 'not_sure';
export type Geography      = 'usd' | 'inr' | 'both' | 'other';
export type Timeline       = 'week' | 'month' | 'quarter' | 'exploring';
export type AppStatus      = 'new' | 'contacted' | 'scoping' | 'building' | 'live' | 'declined';

export interface ApplicationInput {
  name: string;
  email: string;
  company?: string;

  agentName: string;
  agentDesc: string;
  lifecycle: Lifecycle;
  volumeEstimate: VolumeEstimate;

  billingPref: BillingPref;
  geography: Geography;
  geographyOther?: string;

  stack: string;
  timeline: Timeline;
  notes?: string;
}

export interface ApplicationRecord extends ApplicationInput {
  id: string;
  status: AppStatus;
  internalNotes?: string;
  userAgent?: string;
  referrer?: string;
  createdAt: string;
  updatedAt: string;
  contactedAt?: string | null;
}

export const LIFECYCLE_LABELS: Record<Lifecycle, string> = {
  idea:              'Just an idea',
  building:          'Building it now',
  live_no_billing:   'Live · no billing yet',
  live_with_billing: 'Live · billing exists, want to replace',
};

export const VOLUME_LABELS: Record<VolumeEstimate, string> = {
  lt_100:   '< 100 / month',
  '100_1k': '100–1 000 / month',
  '1k_10k': '1 000–10 000 / month',
  '10k_100k': '10 000–100 000 / month',
  gt_100k:  '> 100 000 / month',
};

export const BILLING_LABELS: Record<BillingPref, string> = {
  prepaid:  'Prepaid credits',
  usage:    'Usage-based invoicing',
  both:     'Both — different customers want different things',
  not_sure: "I'm not sure — recommend something",
};

export const GEOGRAPHY_LABELS: Record<Geography, string> = {
  usd:   'USD — global',
  inr:   'INR — India',
  both:  'Both',
  other: 'Other',
};

export const TIMELINE_LABELS: Record<Timeline, string> = {
  week:      'This week',
  month:     'This month',
  quarter:   'This quarter',
  exploring: 'Just exploring',
};

export const STATUS_LABELS: Record<AppStatus, string> = {
  new:       'New',
  contacted: 'Contacted',
  scoping:   'Scoping',
  building:  'Building',
  live:      'Live',
  declined:  'Declined',
};
