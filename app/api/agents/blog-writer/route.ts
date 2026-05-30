import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runAgentCall } from '@/lib/agentRunner';
import { anthropic, anthropicConfigured, MODEL } from '@/lib/anthropic';

const Body = z.object({
  topic: z.string().min(3),
  length: z.enum(['500', '1500']).default('1500'),
  audience: z.string().optional(),
  keywords: z.string().optional(),
});

const SYS = `You are a senior SEO + AEO content writer. Output a long-form article in clean markdown with H2/H3 headings, short paragraphs, and a tight FAQ section at the end optimized for AI-citation. Do not include preamble; start with the H1.`;

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Topic required' }, { status: 400 });

  const cost = parsed.data.length === '1500' ? 20 : 8;
  const action = parsed.data.length === '1500' ? 'generate_1500w' : 'generate_500w';

  const out = await runAgentCall({
    product: 'blog_writer',
    action,
    cost,
    run: async () => {
      if (!anthropicConfigured()) {
        // Stand-in output when no key is set, so flow remains demoable.
        return {
          title: parsed.data.topic,
          markdown: `# ${parsed.data.topic}\n\n_(Set ANTHROPIC_API_KEY to generate a real article.)_\n\nThis is a placeholder ${parsed.data.length}-word draft. Add your Anthropic key in .env.local and re-run to get full Claude output.\n\n## Why it matters\nShort placeholder paragraph.\n\n## FAQ\n**Q: When will this be real?** A: As soon as ANTHROPIC_API_KEY is set.`,
          length: parsed.data.length,
          _meta: { model: 'placeholder' },
        };
      }
      const target = parsed.data.length === '1500' ? '1,400–1,600 words' : '450–550 words';
      const prompt = `Write a ${target} long-form article on: "${parsed.data.topic}".` +
        (parsed.data.audience ? ` Audience: ${parsed.data.audience}.` : '') +
        (parsed.data.keywords ? ` Naturally include these keywords: ${parsed.data.keywords}.` : '') +
        ` Optimize for SEO and AEO (AI-citation friendly).`;
      const res = await anthropic().messages.create({
        model: MODEL,
        max_tokens: parsed.data.length === '1500' ? 4000 : 1500,
        system: SYS,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = res.content.map((c: any) => (c.type === 'text' ? c.text : '')).join('\n').trim();
      return {
        title: parsed.data.topic,
        markdown: text,
        length: parsed.data.length,
        _meta: { model: MODEL, tokens: res.usage?.input_tokens || 0 + (res.usage?.output_tokens || 0) },
      };
    },
  });
  return NextResponse.json(out.body, { status: out.ok ? 200 : out.status });
}
