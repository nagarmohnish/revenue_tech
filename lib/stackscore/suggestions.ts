// Claude-powered augmentation of the deterministic suggestions list.
//
// Strategy: we already have rule-based suggestions for every failing check.
// Claude gets the *full* signal set and the existing suggestions, and adds
// up to 3 contextual, non-duplicate suggestions that take the page-specific
// shape into account (e.g. "your single CTA pattern suggests a wedge —
// commit to one tier and de-emphasize the others"). If Claude is unconfigured
// or errors, the deterministic suggestions still ship — this is additive.

import { anthropic, anthropicConfigured, MODEL } from '../anthropic';
import { Scorecard, Suggestion, DimensionKey } from './types';

const SYSTEM = `You are a conversion-rate consultant reviewing a SaaS pricing/subscription page.

You will receive:
- A deterministic heuristic score (0-100) across 4 dimensions
- The signals we extracted
- The rule-based suggestions already generated

Add 1 to 3 *additional* high-leverage suggestions that the rules can't see, based on the *combination* of signals. Each must:
- Reference something specific in the signals
- Not duplicate a suggestion already provided
- Be a concrete change, not a platitude
- Cite a leader where relevant (Stripe, Notion, Linear, Vercel, Figma, Shopify, Slack, Spotify, Netflix, ChatGPT — only these)

Output ONLY a JSON array. Each item:
{ "dimension": "clarity" | "conversion" | "flexibility" | "trust", "title": string, "body": string, "exemplar": { "company": string, "note": string } | null }

Max 3 items. No markdown, no prose.`;

const VALID_DIMS: DimensionKey[] = ['clarity', 'conversion', 'flexibility', 'trust'];

export async function augmentWithAiSuggestions(card: Scorecard): Promise<Suggestion[]> {
  if (!anthropicConfigured()) return [];
  try {
    const client = anthropic();
    const userPayload = {
      score: card.score,
      dimensions: card.dimensions.map((d) => ({ key: d.key, points: d.points, max: d.max })),
      signals: card.signals,
      existingSuggestions: card.suggestions.map((s) => ({ dimension: s.dimension, title: s.title })),
    };

    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 900,
      system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(userPayload) }],
    });
    const text = res.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('').trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

    let parsed: any;
    try { parsed = JSON.parse(cleaned); }
    catch {
      const first = cleaned.indexOf('[');
      const last  = cleaned.lastIndexOf(']');
      if (first >= 0 && last > first) parsed = JSON.parse(cleaned.slice(first, last + 1));
      else return [];
    }
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, 3).map((p): Suggestion | null => {
      const dim = p?.dimension;
      if (!VALID_DIMS.includes(dim)) return null;
      const title = typeof p?.title === 'string' ? p.title.slice(0, 120) : null;
      const body  = typeof p?.body  === 'string' ? p.body.slice(0, 600)  : null;
      if (!title || !body) return null;
      const ex = p?.exemplar;
      return {
        dimension: dim,
        title,
        body,
        exemplar: (ex && typeof ex?.company === 'string' && typeof ex?.note === 'string')
          ? { company: ex.company.slice(0, 40), note: ex.note.slice(0, 220) }
          : undefined,
        source: 'ai',
      };
    }).filter((x): x is Suggestion => x !== null);
  } catch {
    return [];
  }
}
