import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BuilderShell } from '@/components/BuilderShell';
import { getBuilderSession } from '@/lib/builderAuth';
import { supabaseConfigured } from '@/lib/supabase';
import { listAgentsForTenant, listApiKeysForTenant, getTenant } from '@/lib/builder';
import { CopyButton } from '@/components/CopyButton';
import { TerminalSquare, AlertTriangle } from 'lucide-react';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function IntegrationPage() {
  if (!supabaseConfigured()) return <div className="p-12">Supabase not configured.</div>;
  const session = await getBuilderSession();
  if (!session) redirect('/build/signup');

  const [tenant, agents, keys] = await Promise.all([
    getTenant(session.tenantId),
    listAgentsForTenant(session.tenantId),
    listApiKeysForTenant(session.tenantId),
  ]);

  const baseUrl = env.authUrl.replace(/\/$/, '');
  const activeKeyPrefix = keys.find((k) => !k.revoked_at)?.prefix || 'am_live_xxxxxx';
  const firstAgent = agents[0];
  const firstAction = firstAgent?.actions[0];
  const productId = firstAgent?.product_id || 'your_agent';
  const actionId = firstAction?.action_id || 'do_thing';
  const cost = firstAction?.cost ?? 25;

  return (
    <BuilderShell accountName={tenant.name} accountSlug={tenant.slug}>
      <div>
        <div className="text-[.72rem] uppercase tracking-[.14em] text-brand-600 font-bold">SDK · Step by step</div>
        <h1 className="font-sans font-extrabold text-[2rem] tracking-tight text-ink-950 mt-1">Integration</h1>
        <p className="text-ink-500 text-[15px] mt-1.5">
          Copy these snippets into your agent route. AgentMint handles the wallet, plan gate, and atomic debit; your code stays focused on the agent.
        </p>
      </div>

      <PrereqBanner hasAgent={!!firstAgent} hasKey={activeKeyPrefix !== 'am_live_xxxxxx'} />

      <Block
        n="1"
        title="Set your environment"
        body="Put the key in a secret manager. Never check it into source control. Restart your dev server to pick it up."
      >
        <CodeCard lang="sh" code={`# .env.local
AGENTMINT_API_KEY=${activeKeyPrefix}...
AGENTMINT_BASE_URL=${baseUrl}/api/v1`} />
      </Block>

      <Block
        n="2"
        title="Create a workspace for each end customer"
        body="A workspace is the unit that holds a wallet and gets billed. Create one per end customer (or per project, or per environment, however you scope your billing). The returned workspaceId is what every authorize/debit call references."
      >
        <CodeCard lang="sh" code={`curl -X POST '${baseUrl}/api/v1/workspaces' \\
  -H 'Authorization: Bearer $AGENTMINT_API_KEY' \\
  -H 'content-type: application/json' \\
  -d '{
    "externalId": "customer_abc",         // idempotency key on your side
    "name":       "Acme Corp",
    "ownerEmail": "ops@acme.com",
    "trialCredits": 100,
    "plan":       "trial"
  }'

# response:
# { "workspaceId": "8f7e…", "tenantId": "…", "plan": "trial", "trialCredits": 100 }`} />
      </Block>

      <Block
        n="3"
        title="Authorize before the agent runs"
        body="Plan gate + balance check. Sub-100ms. Returns the full decision package — your frontend can render a precise upgrade CTA from this payload."
      >
        <CodeCard lang="ts" code={`// app/api/agents/${productId}/route.ts
export async function POST(req: Request) {
  const { workspaceId, input } = await req.json();

  const auth = await fetch(\`\${process.env.AGENTMINT_BASE_URL}/authorize\`, {
    method:  'POST',
    headers: {
      'content-type': 'application/json',
      Authorization:  \`Bearer \${process.env.AGENTMINT_API_KEY}\`,
    },
    body: JSON.stringify({
      workspaceId,
      product: '${productId}',
      action:  '${actionId}',
      cost:    ${cost},
    }),
  }).then(r => r.json());

  if (!auth.allowed) {
    // Return the full decision package — every field is useful for an upgrade CTA.
    return Response.json(auth, { status: 402 });
  }

  // ─── Your agent here ──────────────────────────────────────────────
  const result = await runYourAgent(input);

  // ─── Debit after success ──────────────────────────────────────────
  await fetch(\`\${process.env.AGENTMINT_BASE_URL}/debit\`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization:  \`Bearer \${process.env.AGENTMINT_API_KEY}\`,
    },
    body: JSON.stringify({
      workspaceId,
      product:    '${productId}',
      action:     '${actionId}',
      cost:       ${cost},
      resourceId: result.id,                     // any uuid is fine
      idempotencyKey: \`\${workspaceId}-\${result.id}\`, // safe to retry
      meta: { model: result.model, tokens: result.tokens, latencyMs: result.latencyMs },
    }),
  });

  return Response.json({ result, creditsRemaining: auth.creditsRemaining - ${cost} });
}`} />
      </Block>

      <Block n="4" title="Try it from the command line" body="The fastest way to confirm your key + agent + workspace are wired up correctly.">
        <CodeCard lang="sh" code={`curl -X POST '${baseUrl}/api/v1/authorize' \\
  -H 'Authorization: Bearer $AGENTMINT_API_KEY' \\
  -H 'content-type: application/json' \\
  -d '{
    "workspaceId":"<a-workspace-uuid-from-your-tenant>",
    "product":"${productId}",
    "action":"${actionId}",
    "cost":${cost}
  }'`} />
      </Block>

      <Block n="5" title="From Python or any HTTP-speaking runtime" body="Same contract, no SDK lock-in. Two HTTP calls, idempotency by resource_id.">
        <CodeCard lang="py" code={`import os, requests, uuid
BASE = os.environ['AGENTMINT_BASE_URL']
HEADERS = {'Authorization': f"Bearer {os.environ['AGENTMINT_API_KEY']}"}

def run_${productId}(workspace_id: str, payload: dict):
    auth = requests.post(f"{BASE}/authorize", headers=HEADERS, json={
        "workspaceId": workspace_id, "product": "${productId}",
        "action": "${actionId}", "cost": ${cost},
    }).json()
    if not auth.get("allowed"):
        return {"status": 402, "decision": auth}

    result = your_agent(payload)
    rid = str(uuid.uuid4())

    requests.post(f"{BASE}/debit", headers=HEADERS, json={
        "workspaceId": workspace_id, "product": "${productId}",
        "action": "${actionId}", "cost": ${cost},
        "resourceId": rid,
        "idempotencyKey": f"{workspace_id}-{rid}",
    })
    return {"status": 200, "result": result}`} />
      </Block>

      <section className="mt-10 card p-6">
        <h2 className="font-sans font-extrabold text-[1.2rem] tracking-tight text-ink-950">Reference</h2>
        <div className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-5 text-[14px]">
          <Ref label="Base URL"          mono>{baseUrl}/api/v1</Ref>
          <Ref label="Auth header"       mono>Authorization: Bearer am_live_…</Ref>
          <Ref label="Your active key"   mono>{activeKeyPrefix}…</Ref>
          <Ref label="Tenant slug"       mono>{tenant.slug}</Ref>
          <Ref label="Registered agents">{agents.length}</Ref>
          <Ref label="Active API keys">{keys.filter((k) => !k.revoked_at).length}</Ref>
        </div>
        <p className="mt-5 pt-4 border-t border-ink-100 text-[13px] text-ink-500">
          Need new actions or different costs? <Link href="/build/agents" className="text-brand-600 font-semibold hover:underline">Update the registry</Link>. Changes ship on the next request, no deploy needed.
        </p>
      </section>
    </BuilderShell>
  );
}

function PrereqBanner({ hasAgent, hasKey }: { hasAgent: boolean; hasKey: boolean }) {
  if (hasAgent && hasKey) return null;
  return (
    <div className="mt-6 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 flex gap-3">
      <AlertTriangle size={16} className="text-warn mt-0.5 shrink-0" />
      <div className="text-sm text-ink-700">
        Heads up:
        {!hasAgent && <> register an <Link href="/build/agents" className="font-semibold text-ink-900 underline underline-offset-2">agent</Link></>}
        {!hasAgent && !hasKey && ' and'}
        {!hasKey && <> generate an <Link href="/build/api-keys" className="font-semibold text-ink-900 underline underline-offset-2">API key</Link></>}
        {' '}before the snippets below will actually run. The product_id, action_id and key prefix substitute live as you add them.
      </div>
    </div>
  );
}

function Block({ n, title, body, children }: { n: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-7 h-7 rounded-lg bg-ink-950 text-white text-[12px] font-bold flex items-center justify-center font-mono">{n}</span>
        <div className="flex-1">
          <h2 className="font-sans font-extrabold text-[1.2rem] tracking-tight text-ink-950 leading-snug">{title}</h2>
          <p className="text-[14px] text-ink-500 mt-1 leading-relaxed">{body}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CodeCard({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-ink-800" style={{ background: '#06221a' }}>
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-ink-800 text-ink-300 text-[12px] font-mono">
        <span className="flex items-center gap-2">
          <span className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-ink-700" />
          </span>
          <span className="ml-2 uppercase tracking-wider">{lang}</span>
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="px-5 py-4 text-[12.5px] leading-[1.7] overflow-x-auto font-mono whitespace-pre" style={{ color: '#c2d2cb' }}>
        {code}
      </pre>
    </div>
  );
}

function Ref({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-semibold">{label}</div>
      <div className={`mt-0.5 text-ink-900 font-medium break-all ${mono ? 'font-mono text-[12.5px]' : ''}`}>{children}</div>
    </div>
  );
}
