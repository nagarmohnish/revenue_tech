// Claude-augmented suggestions for funnel walks. Additive on top of the
// deterministic ones; absent gracefully if ANTHROPIC_API_KEY is missing.

import { anthropic, anthropicConfigured, MODEL } from '../anthropic';
import type { FlowReport, Suggestion, DimensionKey } from './types';

const VALID_DIMS: DimensionKey[] = ['brevity', 'clarity', 'transparency', 'trust'];

const SYSTEM = `You are a conversion-rate consultant reviewing a checkout funnel walked end-to-end by a headless browser.

You receive: the overall flow score (0-100), four dimension subscores (Brevity, Clarity, Cost transparency, Trust), a list of steps with classification + extracted signals, the terminal reason, and the rule-based suggestions already produced.

Add 1 to 3 *additional* high-leverage suggestions based on the *interaction* between steps (the rules can only see one step at a time). Each must:
- Reference something specific in the flow (a step index, a signal, a transition between steps)
- Not duplicate a rule-based suggestion
- Be concrete: name the change, not the principle
- Cite a leader where relevant (Netflix, Notion, Linear, Stripe, Spotify, Shopify, Vercel, ChatGPT only)

Output ONLY a JSON array of:
{ "scope": "flow" | "step", "stepIndex": number | null, "dimension": "brevity"|"clarity"|"transparency"|"trust", "title": string, "body": string, "exemplar": { "company": string, "note": string } | null }

Max 3 items. No markdown, no prose.`;

export async function augmentFlowWithAi(report: FlowReport): Promise<Suggestion[]> {
  if (!anthropicConfigured()) return [];
  try {
    const payload = {
      score: report.score,
      dimensions: report.dimensions.map((d) => ({ key: d.key, points: d.points, max: d.max, detail: d.detail })),
      terminatedReason: report.terminatedReason,
      stepCount: report.steps.length,
      steps: report.steps.map((s) => ({
        index: s.index,
        url: s.url,
        classification: s.classification,
        clickedCtaText: s.clickedCtaText,
        terminalReason: s.terminalReason,
        signals: {
          ctaCount: s.signals.ctaCount,
          primaryCtaText: s.signals.primaryCtaText,
          competingCtaTexts: s.signals.competingCtaTexts,
          formFieldCount: s.signals.formFieldCount,
          requiredFieldCount: s.signals.requiredFieldCount,
          hasCardField: s.signals.hasCardField,
          hasEmailField: s.signals.hasEmailField,
          hasPasswordField: s.signals.hasPasswordField,
          hasContinueAsGuest: s.signals.hasContinueAsGuest,
          pricePoints: s.signals.pricePoints,
          currencySymbols: s.signals.currencySymbols,
          paymentMethods: s.signals.paymentMethods,
          hasSecurityBadges: s.signals.hasSecurityBadges,
          hasGuarantee: s.signals.hasGuarantee,
          hasStripeIframe: s.signals.hasStripeIframe,
          hasOtherPaymentIframe: s.signals.hasOtherPaymentIframe,
          loadTimeMs: s.signals.loadTimeMs,
        },
      })),
      existingSuggestions: report.suggestions.map((s) => ({ scope: s.scope, dimension: s.dimension, title: s.title })),
    };

    const client = anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    });
    const text = res.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('').trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

    let parsed: any;
    try { parsed = JSON.parse(cleaned); }
    catch {
      const first = cleaned.indexOf('[');
      const last = cleaned.lastIndexOf(']');
      if (first >= 0 && last > first) parsed = JSON.parse(cleaned.slice(first, last + 1));
      else return [];
    }
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, 3).map((p): Suggestion | null => {
      const dim = p?.dimension;
      if (!VALID_DIMS.includes(dim)) return null;
      const title = typeof p?.title === 'string' ? p.title.slice(0, 120) : null;
      const body  = typeof p?.body  === 'string' ? p.body.slice(0, 600) : null;
      if (!title || !body) return null;
      const scope: 'flow' | 'step' = p?.scope === 'step' ? 'step' : 'flow';
      const stepIndex = typeof p?.stepIndex === 'number' ? p.stepIndex : undefined;
      const ex = p?.exemplar;
      return {
        scope, stepIndex, dimension: dim, title, body, source: 'ai',
        exemplar: (ex && typeof ex?.company === 'string' && typeof ex?.note === 'string')
          ? { company: ex.company.slice(0, 40), note: ex.note.slice(0, 220) }
          : undefined,
      };
    }).filter((x): x is Suggestion => x !== null);
  } catch {
    return [];
  }
}
