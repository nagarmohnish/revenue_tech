import { env } from './env';

export function sparrwoConfigured() {
  return !!env.sparrwoKey;
}

export interface ScannerResult {
  citationScore: number;
  perEngine: Array<{ engine: string; score: number; notes?: string }>;
  topQueries: Array<{ query: string; visibility: number }>;
  recommendations: string[];
  raw?: any;
}

export async function callScanner(domain: string): Promise<ScannerResult> {
  if (!sparrwoConfigured()) {
    // Synthesised but stable output so the UI flow can be tested without Sparrwo creds.
    const hash = [...domain].reduce((a, c) => a + c.charCodeAt(0), 0);
    const base = 40 + (hash % 45);
    return {
      citationScore: base,
      perEngine: [
        { engine: 'ChatGPT', score: base + 4 },
        { engine: 'Perplexity', score: base - 3 },
        { engine: 'Gemini', score: base + 1 },
        { engine: 'Claude', score: base + 6 },
      ],
      topQueries: [
        { query: `${domain} pricing`, visibility: 72 },
        { query: `${domain} vs competitors`, visibility: 41 },
        { query: `best alternatives to ${domain}`, visibility: 18 },
      ],
      recommendations: [
        'Add structured FAQ schema on the pricing page',
        `Publish a comparison post for "${domain} vs top 3 competitors"`,
        'Surface customer logos as text near top of homepage for AI extraction',
      ],
    };
  }

  const res = await fetch(`${env.sparrwoUrl}/scan/domain`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.sparrwoKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ domain }),
  });
  if (!res.ok) throw new Error(`Sparrwo Scanner error: ${res.status}`);
  return res.json();
}
