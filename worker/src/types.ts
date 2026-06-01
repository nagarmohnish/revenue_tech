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

export interface StepSignals {
  // CTAs
  ctaCount: number;
  primaryCtaText: string | null;
  competingCtaTexts: string[];

  // Forms
  formFieldCount: number;
  requiredFieldCount: number;
  hasCardField: boolean;
  hasEmailField: boolean;
  hasPasswordField: boolean;
  hasContinueAsGuest: boolean;

  // Pricing
  currencySymbols: string[];
  pricePoints: number[];

  // Trust
  paymentMethods: string[];
  hasSecurityBadges: boolean;
  hasGuarantee: boolean;

  // Page structure
  hasFAQ: boolean;
  viewportHeight: number;
  loadTimeMs: number;

  // Frame & wall detection
  hasStripeIframe: boolean;
  hasOtherPaymentIframe: boolean;
}

export interface FlowStep {
  index: number;
  url: string;
  title: string;
  screenshotBase64: string;        // JPEG, 1280x800
  classification: StepClass;
  signals: StepSignals;
  clickedCtaText: string | null;   // the CTA we clicked to reach the NEXT step
  terminalReason: TerminalReason | null;
}

export interface WalkResponse {
  startUrl: string;
  hostname: string;
  steps: FlowStep[];
  terminatedReason: TerminalReason;
  durationMs: number;
}

export interface WalkRequest {
  url: string;
  maxSteps?: number;
}
