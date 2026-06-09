// Tool 1: Pricing Audit types. The report we save and render.

export interface ScrapedPricing {
  url:              string;
  title:            string;
  description:      string;
  hostname:         string;

  // Pricing extracted from page text
  pricePoints:      number[];       // distinct visible prices, sorted
  currencySymbols:  string[];       // ['$', '€']
  tierCount:        number;         // best-effort plan-card count

  // Tier markers
  hasFree:          boolean;
  hasTrial:         boolean;
  hasFreemium:      boolean;
  hasEnterprise:    boolean;

  // Toggles
  hasAnnualMonthlyToggle: boolean;
  hasAnnualDiscount:      boolean;

  // Trust + social proof
  paymentMethods:   string[];       // ['Stripe', 'PayPal', ...]
  hasSecurityBadges: boolean;
  hasGuarantee:     boolean;
  hasTestimonials:  boolean;
  hasLogos:         boolean;

  // Highlights
  hasHighlightedPlan: boolean;

  // Meta
  primaryCtaText:    string | null;
  themeColor:        string | null; // <meta name="theme-color"> if any
  faviconUrl:        string | null;

  htmlSize:          number;
}

export type BusinessModel =
  | 'freemium'
  | 'trial'
  | 'paid_only'
  | 'usage_based'
  | 'hybrid'
  | 'enterprise_only'
  | 'unknown';

export interface CompetitiveBenchmark {
  name:        string;
  category:    string;
  pattern:     string;     // 1-line summary of how they price
  takeaway:    string;     // what to learn from them
}

export interface AuditFinding {
  area:        'positioning' | 'pricing' | 'conversion' | 'trust';
  severity:    'good' | 'warn' | 'bad';
  title:       string;
  body:        string;
}

export interface AuditRecommendation {
  priority:    'high' | 'medium' | 'low';
  title:       string;
  body:        string;
  exemplar?:   { company: string; note: string };
}

export interface AuditReport {
  url:               string;
  domain:            string;

  // Top-line narrative
  headline:          string;       // 1 sentence: what they're doing well + what to fix
  summary:           string;       // 2-3 sentence executive summary
  businessModel:     BusinessModel;
  modelReasoning:    string;       // why we classified it that way

  // Score breakdown (0-100 total)
  score:             number;
  dimensions:        Array<{ key: 'positioning' | 'pricing' | 'conversion' | 'trust'; label: string; points: number; max: number; detail: string }>;

  // Inputs to the analysis (so the report is self-explaining)
  scraped:           ScrapedPricing;

  // The analysis itself
  findings:          AuditFinding[];
  competitors:       CompetitiveBenchmark[];
  recommendations:   AuditRecommendation[];

  // For PDF / branding
  brandColor:        string;       // hex; defaults to AgentMint brand if none extracted

  // Meta
  generatedBy:       'claude' | 'template';
  generatedAt:       string;
}
