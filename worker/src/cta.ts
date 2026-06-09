// CTA selection: from the current page, pick the link/button most likely to
// progress the user toward purchase, given the step's classification.
//
// Strategy: rank visible clickables by (intent match × prominence). Higher-
// intent text wins over a bigger button with neutral text.

import type { Page, Locator } from 'playwright';
import type { StepClass } from './types.js';

interface CtaCandidate {
  selector: string;
  text: string;
  score: number;
}

// Intent buckets per step type — earlier in the array = higher score.
const INTENT_BY_CLASS: Record<StepClass, RegExp[]> = {
  landing:     [/^(get\s+started|start\s+free|try\s+(it\s+)?free|sign\s+up|join\s+free)/i, /pricing|plans|see\s+plans/i, /^(buy|subscribe|upgrade)/i],
  pricing:     [/^(choose|select|get|start)\b/i, /^(buy|subscribe|upgrade|continue)/i, /^(try\s+free|start\s+free|free\s+trial)/i],
  plan_detail: [/^(continue|next|proceed|checkout|buy|subscribe|get\s+pro|upgrade)/i, /^(start|try|begin)/i],
  signup:      [/^(continue\s+as\s+guest|skip|no\s+thanks)/i],  // we don't fill forms; just look for guest-skip
  checkout:    [/^(continue|next|review|place\s+order|complete\s+order|pay\s+now|confirm)/i],
  payment:     [],  // terminal
  success:     [],  // terminal
  auth_wall:   [/^(continue\s+as\s+guest|skip|guest\s+checkout|sign\s+up)/i],
  error:       [],
  unknown:     [/^(get\s+started|start\s+free|sign\s+up|try)/i, /pricing|see\s+plans/i, /^(buy|subscribe|upgrade|continue)/i],
};

// Words that almost always mean we'd LEAVE the funnel (skip them).
const NEGATIVE_RE = /^(log\s*in|login|sign\s*in|already\s+have|forgot|cancel|back|return|previous|home|^docs?$|^blog$|^careers?$|^about$|^contact|^help$|^support$)/i;

export async function pickPrimaryCta(page: Page, klass: StepClass, alreadyClicked: Set<string>): Promise<Locator | null> {
  if (klass === 'payment' || klass === 'success' || klass === 'error') return null;

  const candidates: CtaCandidate[] = await page.evaluate((ctx) => {
    const intentSources: string[] = ctx.intentSources;
    const negativeRe = new RegExp(ctx.negativeReSrc, 'i');

    const rank = (text: string, isPrimary: boolean): number => {
      if (negativeRe.test(text)) return -100;
      for (let i = 0; i < intentSources.length; i++) {
        const re = new RegExp(intentSources[i], 'i');
        if (re.test(text)) return (intentSources.length - i) * 10 + (isPrimary ? 3 : 0);
      }
      return isPrimary ? 1 : 0;
    };

    const els = Array.from(document.querySelectorAll('a, button, [role="button"]')) as HTMLElement[];
    const out: Array<{ selector: string; text: string; score: number }> = [];
    let idx = 0;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (r.width < 20 || r.height < 14) continue;
      const txt = (el.textContent || '').trim().replace(/\s+/g, ' ');
      if (!txt || txt.length > 60) continue;

      const cls = (el.getAttribute('class') || '').toLowerCase();
      const isPrimary = /(primary|btn-primary|cta|brand|accent|main)/.test(cls);
      const score = rank(txt, isPrimary);
      if (score <= 0) continue;

      // Assign a stable selector via data-attribute we set ourselves.
      const key = `stackscore-cta-${idx++}`;
      el.setAttribute('data-stackscore-cta', key);
      out.push({ selector: `[data-stackscore-cta="${key}"]`, text: txt, score });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 5);
  }, {
    intentSources: INTENT_BY_CLASS[klass].map((r) => r.source),
    negativeReSrc: NEGATIVE_RE.source,
  });

  for (const c of candidates) {
    if (alreadyClicked.has(c.text.toLowerCase())) continue;
    return page.locator(c.selector).first();
  }
  return null;
}

export function ctaText(loc: Locator | null): Promise<string | null> {
  if (!loc) return Promise.resolve(null);
  return loc.textContent().then((t) => (t ? t.trim().replace(/\s+/g, ' ') : null));
}
