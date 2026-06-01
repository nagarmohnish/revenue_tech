// StackScore now analyzes the *entire* payment funnel — landing → CTA → pricing
// → checkout — not a single page. These types mirror the worker's WalkResponse
// and add the scoring/aggregation that lives on the Next.js side.

export type StepClass =
  | 'landing'
  | 'pricing'
  | 'plan_detail'
  | 'signup'
  | 'checkout'
  | 'payment'
  | 'success'
  | 'auth_wall'
  | 'error'
  | 'unknown';

export type TerminalReason =
  | 'completed'
  | 'auth_wall'
  | 'payment_reached'
  | 'external_redirect'
  | 'success_page'
  | 'max_steps'
  | 'loop'
  | 'no_progress'
  | 'navigation_error';

export type DimensionKey = 'brevity' | 'clarity' | 'transparency' | 'trust';

export interface StepSignals {
  ctaCount: number;
  primaryCtaText: string | null;
  competingCtaTexts: string[];

  formFieldCount: number;
  requiredFieldCount: number;
  hasCardField: boolean;
  hasEmailField: boolean;
  hasPasswordField: boolean;
  hasContinueAsGuest: boolean;

  currencySymbols: string[];
  pricePoints: number[];

  paymentMethods: string[];
  hasSecurityBadges: boolean;
  hasGuarantee: boolean;

  hasFAQ: boolean;
  viewportHeight: number;
  loadTimeMs: number;

  hasStripeIframe: boolean;
  hasOtherPaymentIframe: boolean;
}

export interface FlowStep {
  index: number;
  url: string;
  title: string;
  screenshotBase64: string;
  classification: StepClass;
  signals: StepSignals;
  clickedCtaText: string | null;
  terminalReason: TerminalReason | null;
}

export interface WalkResponse {
  startUrl: string;
  hostname: string;
  steps: FlowStep[];
  terminatedReason: TerminalReason;
  durationMs: number;
}

export interface DimensionResult {
  key: DimensionKey;
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface StepFinding {
  stepIndex: number;
  severity: 'good' | 'warn' | 'bad';
  title: string;
  body: string;
}

export interface Suggestion {
  scope: 'flow' | 'step';
  stepIndex?: number;
  dimension: DimensionKey;
  title: string;
  body: string;
  exemplar?: { company: string; note: string };
  source: 'rule' | 'ai';
}

export interface BenchmarkFlow {
  name: string;
  steps: number;
  score: number;
  signature: string;
  highlight: string;
}

export interface FlowReport {
  startUrl: string;
  hostname: string;
  score: number;
  dimensions: DimensionResult[];
  findings: StepFinding[];
  suggestions: Suggestion[];
  steps: FlowStep[];
  terminatedReason: TerminalReason;
  benchmarks: BenchmarkFlow[];
  rank: { position: number; total: number; closestTo: string };
  generatedAt: string;
  durationMs: number;
}
