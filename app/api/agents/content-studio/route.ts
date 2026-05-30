import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runAgentCall } from '@/lib/agentRunner';
import { anthropic, anthropicConfigured, MODEL } from '@/lib/anthropic';

const Body = z.object({
  prompt: z.string().min(3),
  channel: z.enum(['linkedin', 'twitter', 'instagram']).default('linkedin'),
  count: z.number().int().min(1).max(5).default(3),
});

const SYS = `You write punchy short-form social posts for B2B/SaaS. No hashtags soup, no emojis unless on Instagram. Each post is self-contained and scroll-stopping.`;

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Prompt required' }, { status: 400 });

  const out = await runAgentCall({
    product: 'content_studio',
    action: 'generate_post',
    cost: 2 * parsed.data.count,
    run: async () => {
      if (!anthropicConfigured()) {
        const posts = Array.from({ length: parsed.data.count }, (_, i) =>
          `Placeholder ${parsed.data.channel} post ${i + 1} for: ${parsed.data.prompt}\n\n(Set ANTHROPIC_API_KEY for real generation.)`,
        );
        return { channel: parsed.data.channel, posts, _meta: { model: 'placeholder' } };
      }
      const res = await anthropic().messages.create({
        model: MODEL,
        max_tokens: 1200,
        system: SYS,
        messages: [
          {
            role: 'user',
            content: `Write ${parsed.data.count} ${parsed.data.channel} posts about: "${parsed.data.prompt}". Number them 1., 2., 3. Each post separated by a blank line. Keep each under 220 words.`,
          },
        ],
      });
      const raw = res.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('\n');
      const posts = raw
        .split(/\n(?=\d+\.\s)/)
        .map((s) => s.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean);
      return {
        channel: parsed.data.channel,
        posts,
        _meta: { model: MODEL, tokens: (res.usage?.input_tokens || 0) + (res.usage?.output_tokens || 0) },
      };
    },
  });
  return NextResponse.json(out.body, { status: out.ok ? 200 : out.status });
}
