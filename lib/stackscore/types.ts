export type DimensionKey = 'clarity' | 'conversion' | 'flexibility' | 'trust';
export type InputKind = 'url' | 'screenshot';

export interface Signals {
  // pricing structure
  currencySymbols: string[];
  pricePoints: number[];
  planCount: number;

  // tier markers
  hasFree: boolean;
  hasTrial: boolean;
  hasFreemium: boolean;
  hasEnterprise: boolean;

  // toggles
  hasAnnualMonthlyToggle: boolean;
  hasAnnualDiscount: boolean;

  // CTAs
  ctaCount: number;
  primaryCtaText: string | null;
  hasHighlightedPlan: boolean;

  // social proof
  hasTestimonials: boolean;
  hasLogos: boolean;

  // trust
  paymentMethods: string[];
  hasSecurityBadges: boolean;
  hasGuarantee: boolean;

  // content
  hasFAQ: boolean;
  hasCancellationMessaging: boolean;

  // meta
  title: string;
  url: string | null;
  hostname: string | null;
  htmlSize: number;
}

export interface DimensionResult {
  key: DimensionKey;
  label: string;
  points: number;
  max: number;
  hits: Array<{ rule: string; pass: boolean; weight: number; detail?: string }>;
}

export interface Suggestion {
  dimension: DimensionKey;
  title: string;
  body: string;
  exemplar?: { company: string; note: string };
  source: 'rule' | 'ai';
}

export interface Benchmark {
  name: string;
  url: string;
  score: number;
  dimensions: Record<DimensionKey, number>;
  highlight: string;
}

export interface RankInfo {
  position: number;
  total: number;
  closestTo: string;
  median: number;
}

export interface Scorecard {
  url: string | null;
  hostname: string | null;
  inputKind: InputKind;
  score: number;
  dimensions: DimensionResult[];
  suggestions: Suggestion[];
  signals: Signals;
  benchmarks: Benchmark[];
  rank: RankInfo;
  generatedAt: string;
}
