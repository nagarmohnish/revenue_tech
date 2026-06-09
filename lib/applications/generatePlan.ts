// Plan generator. Calls Claude for the qualitative content (reasoning, tier
// names + positioning, integration descriptions) and computes the revenue
// projections deterministically. Falls back to the template plan if Claude
// is unconfigured or returns garbage.

import { anthropic, anthropicConfigured, MODEL } from '../anthropic';
import type { ApplicationInput } from './types';
import { BILLING_LABELS, GEOGRAPHY_LABELS, LIFECYCLE_LABELS, VOLUME_LABELS, TIMELINE_LABELS } from './types';
import type { MonetizationPlan, PricingTier, IntegrationStep, NextAction, RecommendedMode } from './planTypes';
import { computeProjections } from './projections';
import { buildTemplatePlan } from './templatePlan';

const SYSTEM_PROMPT = `You are a SaaS pricing strategist analyzing a builder's intake form for AgentMint, a billing platform for AI agents.

Generate a personalized monetization plan as JSON, specific to THEIR agent. Reference the agent by name. Use concrete numbers.

Output ONLY a JSON object matching this exact shape (no prose, no backticks, no markdown):

{
  "headline": "1 sentence headline recommendation, max 90 chars",
  "reasoning": "2-3 sentences explaining why",
  "recommendedMode": "prepaid" | "usage" | "hybrid",
  "modeJustification": "1 paragraph (3-5 sentences) defending the billing-mode choice",
  "tiers": [
    {
      "name": "Tier name (e.g. Starter, Pro, Scale)",
      "positioning": "1-sentence audience hook for this tier",
      "price": "$X or 'Free' or '$X per call'",
      "unit": "/ month" | "per call" | "" | "one-time",
      "allotment": "what they get (e.g. 200 credits, 5,000 calls, Unlimited)",
      "features": ["3-5 bullet points specific to their agent"],
      "highlighted": true | false
    },
    { ... 3 tiers total, mark the middle one highlighted=true ... }
  ],
  "integration": {
    "estimatedHours": <number, realistic for their stack>,
    "language": "typescript" | "python" | "go",
    "steps": [
      { "title": "...", "description": "1-2 sentences" },
      ... 4-5 steps total
    ],
    "codeSnippet": "ready-to-paste integration code in the chosen language, with their product/action substituted; 15-25 lines"
  },
  "nextActions": [
    { "title": "...", "description": "...", "cta": "...", "href": "/build/signup or null" },
    ... 3 actions
  ]
}

Rules:
- Reference the agent BY NAME at least 3 times across the document.
- Tier prices must be real numbers — never "$X". If usage-based, use real per-call costs.
- 'recommendedMode' should respect the builder's stated preference unless their volume/lifecycle makes another mode obviously correct.
- The code snippet must be syntactically valid and use real-looking values (e.g., product: 'scanner', action: 'score_page', cost: 1).
- DO NOT mention the projections object — that's computed downstream.`;

const VALID_MODES: RecommendedMode[] = ['prepaid', 'usage', 'hybrid'];
const VALID_LANGS: Array<'typescript' | 'python' | 'go'> = ['typescript', 'python', 'go'];

export async function generatePlan(input: ApplicationInput): Promise<MonetizationPlan> {
  if (!anthropicConfigured()) {
    return buildTemplatePlan(input);
  }
  try {
    const client = anthropic();
    const userPayload = {
      agentName:       input.agentName,
      agentDescription: input.agentDesc,
      lifecycle:       LIFECYCLE_LABELS[input.lifecycle],
      monthlyVolume:   VOLUME_LABELS[input.volumeEstimate],
      preferredBilling: BILLING_LABELS[input.billingPref],
      geography:       `${GEOGRAPHY_LABELS[input.geography]}${input.geographyOther ? ` (${input.geographyOther})` : ''}`,
      stack:           input.stack,
      timeline:        TIMELINE_LABELS[input.timeline],
      notes:           input.notes || '(none)',
    };

    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(userPayload, null, 2) }],
    });

    const text = res.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('').trim();
    const parsed = extractJsonObject(text);
    if (!parsed) throw new Error('Could not parse plan JSON');

    const plan = normalizePlan(parsed, input);
    if (!plan) throw new Error('Plan did not pass validation');
    return plan;
  } catch {
    return buildTemplatePlan(input);
  }
}

function extractJsonObject(s: string): any | null {
  if (!s) return null;
  const cleaned = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const first = cleaned.indexOf('{');
  const last  = cleaned.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch { return null; }
  }
  return null;
}

function normalizePlan(raw: any, input: ApplicationInput): MonetizationPlan | null {
  // Required scalars
  const headline   = strField(raw.headline, 200);
  const reasoning  = strField(raw.reasoning, 800);
  const mode       = VALID_MODES.includes(raw.recommendedMode) ? raw.recommendedMode : null;
  const just       = strField(raw.modeJustification, 1200);
  if (!headline || !reasoning || !mode || !just) return null;

  // Tiers
  const rawTiers = Array.isArray(raw.tiers) ? raw.tiers.slice(0, 3) : [];
  if (rawTiers.length < 1) return null;
  const tiers: PricingTier[] = rawTiers.map((t: any, i: number): PricingTier => ({
    name:        strField(t.name, 40) || `Tier ${i + 1}`,
    positioning: strField(t.positioning, 160) || '',
    price:       strField(t.price, 40) || '$0',
    unit:        strField(t.unit, 40) || '',
    allotment:   strField(t.allotment, 80) || '',
    features:    Array.isArray(t.features) ? t.features.slice(0, 6).map((f: any) => strField(f, 200) || '').filter(Boolean) : [],
    highlighted: !!t.highlighted,
  })).filter((t: PricingTier) => t.features.length > 0);
  if (tiers.length < 3) {
    // Backfill from template if Claude shorted us.
    const template = buildTemplatePlan(input);
    while (tiers.length < 3) tiers.push(template.tiers[tiers.length]);
  }
  // Ensure exactly one tier marked highlighted.
  if (!tiers.some((t) => t.highlighted)) tiers[Math.min(1, tiers.length - 1)].highlighted = true;

  // Integration
  const rawInt = raw.integration || {};
  const lang = VALID_LANGS.includes(rawInt.language) ? rawInt.language : 'typescript';
  const steps: IntegrationStep[] = Array.isArray(rawInt.steps)
    ? rawInt.steps.slice(0, 6).map((s: any) => ({
        title:       strField(s.title, 100) || '',
        description: strField(s.description, 400) || '',
      })).filter((s: IntegrationStep) => s.title && s.description)
    : [];
  const integration = {
    estimatedHours: typeof rawInt.estimatedHours === 'number' ? Math.max(1, Math.min(40, Math.round(rawInt.estimatedHours))) : 2,
    steps:         steps.length >= 3 ? steps : buildTemplatePlan(input).integration.steps,
    codeSnippet:   strField(rawInt.codeSnippet, 3000) || buildTemplatePlan(input).integration.codeSnippet,
    language:      lang,
  };

  // Next actions
  const rawActions = Array.isArray(raw.nextActions) ? raw.nextActions.slice(0, 3) : [];
  const nextActions: NextAction[] = rawActions.map((a: any): NextAction => ({
    title:       strField(a.title, 100) || '',
    description: strField(a.description, 300) || '',
    cta:         strField(a.cta, 60) || 'Learn more',
    href:        typeof a.href === 'string' ? a.href.slice(0, 200) : undefined,
  })).filter((a: NextAction) => a.title && a.description);
  if (nextActions.length === 0) {
    nextActions.push(...buildTemplatePlan(input).nextActions);
  }

  // Deterministic projections last.
  const projections = computeProjections(input, tiers);

  return {
    headline,
    reasoning,
    recommendedMode: mode,
    modeJustification: just,
    tiers,
    projections,
    integration,
    nextActions,
    generatedBy: 'claude',
    generatedAt: new Date().toISOString(),
  };
}

function strField(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}
