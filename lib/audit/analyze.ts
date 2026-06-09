// Claude-powered analysis of a scraped pricing page. Produces the qualitative
// half of the report (headline, business model, findings, competitor refs,
// recommendations). Score breakdown is computed deterministically downstream.

import { anthropic, anthropicConfigured, MODEL } from '../anthropic';
import type {
  AuditFinding, AuditRecommendation, AuditReport, BusinessModel,
  CompetitiveBenchmark, ScrapedPricing,
} from './types';

const VALID_MODELS: BusinessModel[] = ['freemium', 'trial', 'paid_only', 'usage_based', 'hybrid', 'enterprise_only', 'unknown'];

const SYSTEM_PROMPT = `You are a SaaS pricing strategist auditing a company's public pricing surface. You will receive structured signals extracted from their pricing page. Produce a concise, opinionated competitive audit as JSON.

Output ONLY a JSON object with this shape (no prose, no backticks):

{
  "headline": "1 sentence (max 130 chars) — what they're doing well + the single biggest thing to fix",
  "summary": "2-3 sentence executive summary, business-school style",
  "businessModel": "freemium" | "trial" | "paid_only" | "usage_based" | "hybrid" | "enterprise_only" | "unknown",
  "modelReasoning": "1 paragraph (3-4 sentences) explaining the classification",

  "findings": [
    { "area": "positioning" | "pricing" | "conversion" | "trust", "severity": "good" | "warn" | "bad", "title": "...", "body": "1-2 sentences" },
    ... 4-7 findings, mix of severities
  ],

  "competitors": [
    { "name": "company name", "category": "1-word", "pattern": "1-line summary of how they price", "takeaway": "what this domain can learn from them" },
    ... 3 competitors, real companies in the same category
  ],

  "recommendations": [
    { "priority": "high" | "medium" | "low", "title": "...", "body": "2-3 sentences with a concrete action", "exemplar": { "company": "...", "note": "..." } },
    ... 3-5 recommendations, ranked by leverage
  ]
}

Rules:
- Reference real public companies in 'competitors'. Pick ones with the same business model.
- Be specific to THIS company. Reference their hostname / title / pricing pattern.
- 'findings' should mix severities — at least one good, at least one bad. Don't just enumerate every signal.
- 'recommendations' must each name a concrete action — not principles.
- Keep total output under 1800 tokens. Be terse.`;

export async function analyzeWithClaude(scraped: ScrapedPricing): Promise<{
  headline: string;
  summary: string;
  businessModel: BusinessModel;
  modelReasoning: string;
  findings: AuditFinding[];
  competitors: CompetitiveBenchmark[];
  recommendations: AuditRecommendation[];
  generatedBy: 'claude' | 'template';
} | null> {
  if (!anthropicConfigured()) return null;
  try {
    const client = anthropic();
    const payload = {
      url:                    scraped.url,
      hostname:               scraped.hostname,
      title:                  scraped.title,
      description:            scraped.description,
      pricePoints:            scraped.pricePoints,
      currencySymbols:        scraped.currencySymbols,
      tierCount:              scraped.tierCount,
      hasFree:                scraped.hasFree,
      hasTrial:               scraped.hasTrial,
      hasFreemium:            scraped.hasFreemium,
      hasEnterprise:          scraped.hasEnterprise,
      hasAnnualMonthlyToggle: scraped.hasAnnualMonthlyToggle,
      hasAnnualDiscount:      scraped.hasAnnualDiscount,
      paymentMethods:         scraped.paymentMethods,
      hasSecurityBadges:      scraped.hasSecurityBadges,
      hasGuarantee:           scraped.hasGuarantee,
      hasTestimonials:        scraped.hasTestimonials,
      hasLogos:               scraped.hasLogos,
      hasHighlightedPlan:     scraped.hasHighlightedPlan,
      primaryCtaText:         scraped.primaryCtaText,
    };

    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(payload, null, 2) }],
    });
    const text = res.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('').trim();
    const obj = extractJsonObject(text);
    if (!obj) return null;
    return normalize(obj, scraped);
  } catch {
    return null;
  }
}

function extractJsonObject(s: string): any | null {
  const cleaned = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const first = cleaned.indexOf('{');
  const last  = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch { return null; }
  }
  return null;
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim(); if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

const VALID_AREAS = new Set(['positioning', 'pricing', 'conversion', 'trust']);
const VALID_SEVERITIES = new Set(['good', 'warn', 'bad']);
const VALID_PRIORITIES = new Set(['high', 'medium', 'low']);

function normalize(raw: any, _scraped: ScrapedPricing) {
  const headline       = str(raw.headline, 200);
  const summary        = str(raw.summary, 800);
  const businessModel: BusinessModel = VALID_MODELS.includes(raw.businessModel) ? raw.businessModel : 'unknown';
  const modelReasoning = str(raw.modelReasoning, 800);
  if (!headline || !summary || !modelReasoning) return null;

  const findings: AuditFinding[] = (Array.isArray(raw.findings) ? raw.findings : []).slice(0, 8)
    .map((f: any) => {
      const area = VALID_AREAS.has(f?.area) ? f.area : null;
      const sev  = VALID_SEVERITIES.has(f?.severity) ? f.severity : null;
      const title = str(f?.title, 120);
      const body  = str(f?.body, 400);
      if (!area || !sev || !title || !body) return null;
      return { area, severity: sev, title, body };
    }).filter(Boolean) as AuditFinding[];

  const competitors: CompetitiveBenchmark[] = (Array.isArray(raw.competitors) ? raw.competitors : []).slice(0, 4)
    .map((c: any) => {
      const name = str(c?.name, 60);
      const category = str(c?.category, 40) || 'SaaS';
      const pattern = str(c?.pattern, 180);
      const takeaway = str(c?.takeaway, 240);
      if (!name || !pattern || !takeaway) return null;
      return { name, category, pattern, takeaway };
    }).filter(Boolean) as CompetitiveBenchmark[];

  const recommendations: AuditRecommendation[] = (Array.isArray(raw.recommendations) ? raw.recommendations : []).slice(0, 5)
    .map((r: any) => {
      const priority = VALID_PRIORITIES.has(r?.priority) ? r.priority : 'medium';
      const title = str(r?.title, 120);
      const body  = str(r?.body, 500);
      if (!title || !body) return null;
      const ex = r?.exemplar;
      return {
        priority, title, body,
        exemplar: ex && typeof ex.company === 'string' && typeof ex.note === 'string'
          ? { company: ex.company.slice(0, 60), note: ex.note.slice(0, 240) }
          : undefined,
      };
    }).filter(Boolean) as AuditRecommendation[];

  if (findings.length < 2 || recommendations.length < 2) return null;

  return {
    headline, summary, businessModel, modelReasoning,
    findings, competitors, recommendations,
    generatedBy: 'claude' as const,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic fallback — runs when Claude is unconfigured or returns garbage.
// ─────────────────────────────────────────────────────────────────────────────

export function templateAnalysis(scraped: ScrapedPricing) {
  const businessModel: BusinessModel =
    scraped.hasFreemium && scraped.hasEnterprise        ? 'hybrid'           :
    scraped.hasFreemium                                  ? 'freemium'         :
    scraped.hasTrial && !scraped.hasFree                 ? 'trial'            :
    !scraped.hasFree && scraped.hasEnterprise && scraped.pricePoints.length === 0 ? 'enterprise_only' :
    scraped.pricePoints.length > 0                       ? 'paid_only'        :
                                                           'unknown';

  const findings: AuditFinding[] = [];
  if (scraped.pricePoints.length >= 2) findings.push({ area: 'pricing', severity: 'good', title: 'Multiple price points are visible', body: `${scraped.pricePoints.length} distinct prices detected — buyers can self-qualify.` });
  if (!scraped.hasHighlightedPlan)     findings.push({ area: 'conversion', severity: 'warn', title: 'No tier highlighted as "Most popular"', body: 'A single visually-anchored plan increases conversion to that tier in most A/B tests.' });
  if (!scraped.hasGuarantee)           findings.push({ area: 'trust', severity: 'warn', title: '"Cancel anytime" / money-back language missing', body: 'A guarantee in writing reduces card abandonment.' });
  if (scraped.paymentMethods.length === 0) findings.push({ area: 'trust', severity: 'bad', title: 'No payment methods named on the page', body: 'Logos for Stripe / PayPal / Apple Pay near the checkout button reduce friction.' });
  if (scraped.hasAnnualMonthlyToggle && !scraped.hasAnnualDiscount) findings.push({ area: 'conversion', severity: 'warn', title: 'Annual toggle present but discount not surfaced', body: 'Don\'t make the visitor do the math — show "save 20%" or "2 months free" alongside the annual price.' });

  if (findings.length === 0) {
    findings.push({ area: 'positioning', severity: 'warn', title: 'Pricing page is hard to extract from', body: 'Either JS-rendered or behind a wall — most prospects will bounce before they reach it.' });
  }

  const competitors: CompetitiveBenchmark[] = [
    { name: 'Stripe',  category: 'Payments',    pattern: 'Per-transaction transparency — every fee disclosed inline.',  takeaway: 'Stop hiding pricing. Show all costs.' },
    { name: 'Notion',  category: 'Productivity', pattern: 'Generous freemium, annual saves 20% in dollars + percent.', takeaway: 'Make the discount mathematically obvious.' },
    { name: 'Linear',  category: 'Dev tools',    pattern: 'Three tiers, one CTA per tier, zero noise.',               takeaway: 'One obvious next action per tier.' },
  ];

  const recommendations: AuditRecommendation[] = [];
  if (!scraped.hasHighlightedPlan)         recommendations.push({ priority: 'high',   title: 'Highlight a "Most popular" plan', body: 'Pick the tier you want most prospects on, add a border + badge. Cheap A/B test, often 20-40% conversion lift.', exemplar: { company: 'Notion', note: 'Plus tier is badged Most popular — and that\'s where most users land.' } });
  if (!scraped.hasGuarantee)               recommendations.push({ priority: 'medium', title: 'Add a money-back or cancel-anytime guarantee', body: 'In writing, near the checkout CTA. Removes the last objection.', exemplar: { company: 'Shopify', note: '"Cancel anytime, no setup fees" sits directly above the checkout fields.' } });
  if (scraped.paymentMethods.length === 0) recommendations.push({ priority: 'high',   title: 'Name the payment methods you accept', body: 'Stripe / PayPal / Apple Pay logos near the CTA. Familiarity reduces abandonment.' });
  if (!scraped.hasAnnualMonthlyToggle && scraped.pricePoints.length >= 2) recommendations.push({ priority: 'medium', title: 'Offer a monthly/annual toggle', body: 'Default to annual with the discount surfaced as a percent. Anchoring lifts annual conversion in self-serve SaaS.' });
  if (recommendations.length === 0) {
    recommendations.push({ priority: 'medium', title: 'Audit your pricing page in a competitor lens', body: 'Run StackScore against your own funnel and compare against benchmarks.' });
  }

  const headline = `${scraped.hostname} is running a ${businessModel.replace(/_/g, ' ')} model — ${recommendations[0]?.title.toLowerCase() ?? 'tighten the pricing surface'}.`;
  const summary  = `${scraped.title || scraped.hostname} surfaces ${scraped.pricePoints.length} price point(s) across ${scraped.tierCount} tier(s). ${findings[0]?.body ?? ''} The highest-leverage move is ${recommendations[0]?.title.toLowerCase() ?? 'unclear without more signal'}.`;

  return {
    headline, summary, businessModel,
    modelReasoning: `Classified as ${businessModel.replace(/_/g, ' ')} from signals: free=${scraped.hasFree}, trial=${scraped.hasTrial}, enterprise=${scraped.hasEnterprise}, prices=${scraped.pricePoints.length}.`,
    findings, competitors, recommendations,
    generatedBy: 'template' as const,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic score + dimension breakdown
// ─────────────────────────────────────────────────────────────────────────────

export function scoreAudit(scraped: ScrapedPricing): AuditReport['dimensions'] & { total: number } {
  const dims = {
    positioning: { points: 0, max: 25, hits: [] as string[] },
    pricing:     { points: 0, max: 25, hits: [] as string[] },
    conversion:  { points: 0, max: 25, hits: [] as string[] },
    trust:       { points: 0, max: 25, hits: [] as string[] },
  };

  // POSITIONING (25)
  if (scraped.title) { dims.positioning.points += 5; dims.positioning.hits.push('Title present'); }
  if (scraped.description) { dims.positioning.points += 5; dims.positioning.hits.push('Description meta present'); }
  if (scraped.primaryCtaText) { dims.positioning.points += 8; dims.positioning.hits.push(`Primary CTA: "${scraped.primaryCtaText}"`); }
  if (scraped.themeColor || scraped.faviconUrl) { dims.positioning.points += 7; dims.positioning.hits.push('Brand markers present'); }

  // PRICING (25)
  if (scraped.pricePoints.length >= 1) dims.pricing.points += 8;
  if (scraped.pricePoints.length >= 3) dims.pricing.points += 5;
  if (scraped.tierCount >= 3) dims.pricing.points += 5;
  if (scraped.currencySymbols.length >= 1) dims.pricing.points += 4;
  if (scraped.currencySymbols.length >= 2) dims.pricing.points += 3;

  // CONVERSION (25)
  if (scraped.hasHighlightedPlan) dims.conversion.points += 8;
  if (scraped.hasFree || scraped.hasTrial) dims.conversion.points += 7;
  if (scraped.hasAnnualMonthlyToggle) dims.conversion.points += 5;
  if (scraped.hasAnnualDiscount) dims.conversion.points += 5;

  // TRUST (25)
  if (scraped.paymentMethods.length >= 1) dims.trust.points += 7;
  if (scraped.hasSecurityBadges) dims.trust.points += 5;
  if (scraped.hasTestimonials || scraped.hasLogos) dims.trust.points += 7;
  if (scraped.hasGuarantee) dims.trust.points += 6;

  const dimensions = [
    { key: 'positioning' as const, label: 'Positioning', points: Math.min(25, dims.positioning.points), max: 25, detail: dims.positioning.hits.join(' · ') || 'No positioning signals captured' },
    { key: 'pricing'     as const, label: 'Pricing',     points: Math.min(25, dims.pricing.points),     max: 25, detail: `${scraped.pricePoints.length} price points · ${scraped.tierCount} tiers · ${scraped.currencySymbols.length} currencies` },
    { key: 'conversion'  as const, label: 'Conversion',  points: Math.min(25, dims.conversion.points),  max: 25, detail: `highlighted=${scraped.hasHighlightedPlan} · free/trial=${scraped.hasFree || scraped.hasTrial} · annual-toggle=${scraped.hasAnnualMonthlyToggle}` },
    { key: 'trust'       as const, label: 'Trust',       points: Math.min(25, dims.trust.points),       max: 25, detail: `methods=${scraped.paymentMethods.length} · security=${scraped.hasSecurityBadges} · guarantee=${scraped.hasGuarantee}` },
  ];

  return Object.assign(dimensions, { total: dimensions.reduce((a, d) => a + d.points, 0) }) as any;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public entrypoint
// ─────────────────────────────────────────────────────────────────────────────

export async function buildAuditReport(scraped: ScrapedPricing): Promise<AuditReport> {
  const analysis = (await analyzeWithClaude(scraped)) ?? templateAnalysis(scraped);
  const dimensions = scoreAudit(scraped);
  const total = (dimensions as any).total;
  const brandColor = scraped.themeColor && /^#[0-9a-f]{6}$/i.test(scraped.themeColor) ? scraped.themeColor : '#10a868';

  return {
    url:    scraped.url,
    domain: scraped.hostname,
    headline:       analysis.headline,
    summary:        analysis.summary,
    businessModel:  analysis.businessModel,
    modelReasoning: analysis.modelReasoning,
    score:          total,
    dimensions:     (dimensions as any).slice(0, 4),
    scraped,
    findings:        analysis.findings,
    competitors:     analysis.competitors,
    recommendations: analysis.recommendations,
    brandColor,
    generatedBy:     analysis.generatedBy,
    generatedAt:     new Date().toISOString(),
  };
}
