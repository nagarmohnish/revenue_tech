// Deterministic fallback plan — used when Claude is unconfigured, errors, or
// returns malformed JSON. Still personalized using the builder's answers; we
// just don't get the LLM's nuanced reasoning.

import type { ApplicationInput, BillingPref } from './types';
import type { MonetizationPlan, PricingTier, RecommendedMode } from './planTypes';
import { BILLING_LABELS, GEOGRAPHY_LABELS, VOLUME_LABELS, LIFECYCLE_LABELS } from './types';
import { computeProjections } from './projections';

const MODE_FROM_PREF: Record<BillingPref, RecommendedMode> = {
  prepaid: 'prepaid',
  usage: 'usage',
  both: 'hybrid',
  not_sure: 'prepaid', // safe default — easiest mental model for customers
};

function actionKey(name: string): string {
  // turn "Sparrwo Scanner" into "scan_page" guess; very rough.
  const lower = name.toLowerCase();
  if (/scan/.test(lower))   return 'scan_page';
  if (/analy/.test(lower))  return 'analyze';
  if (/writer|write|gen/.test(lower)) return 'generate';
  if (/voice|speak/.test(lower))      return 'transcribe';
  if (/schedule/.test(lower)) return 'queue_task';
  if (/class/.test(lower))    return 'classify';
  return 'run';
}

function productKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24) || 'agent';
}

function buildTiers(input: ApplicationInput, mode: RecommendedMode): PricingTier[] {
  const isPrepaid = mode === 'prepaid' || mode === 'hybrid';
  if (isPrepaid) {
    return [
      {
        name: 'Starter',
        positioning: 'For individuals trying it out.',
        price: 'Free',
        unit: '',
        allotment: '50 credits / month',
        features: ['1 workspace', 'Email support', `${input.agentName} — every action available`],
      },
      {
        name: 'Pro',
        positioning: 'For active users.',
        price: '$29',
        unit: '/ month',
        allotment: '1,000 credits / month',
        features: ['Unlimited workspaces', 'Priority email support', 'Auto-reload when low', 'Per-agent usage breakdown'],
        highlighted: true,
      },
      {
        name: 'Scale',
        positioning: 'For teams running production workloads.',
        price: '$99',
        unit: '/ month',
        allotment: '10,000 credits / month',
        features: ['Everything in Pro', 'SLA + Slack support', 'Custom credit cost per action', 'Volume discounts'],
      },
    ];
  }
  // usage-based
  return [
    {
      name: 'Pay-as-you-go',
      positioning: 'No floor. Pay only for what you use.',
      price: '$0.03',
      unit: 'per call',
      allotment: 'Metered, billed monthly',
      features: ['No commitment', `Per-call billing for ${input.agentName}`, 'Stripe card on file'],
    },
    {
      name: 'Pro',
      positioning: 'For predictable usage.',
      price: '$99',
      unit: '/ month',
      allotment: 'Up to 5,000 calls included',
      features: ['$0.025 per call beyond', 'Auto-reconciled invoice', 'Per-agent line items'],
      highlighted: true,
    },
    {
      name: 'Volume',
      positioning: 'For high-throughput teams.',
      price: '$499',
      unit: '/ month',
      allotment: 'Up to 30,000 calls included',
      features: ['$0.015 per call beyond', 'Net-15 payment terms', 'Volume discount on commit'],
    },
  ];
}

function buildIntegration(input: ApplicationInput) {
  const product = productKey(input.agentName);
  const action  = actionKey(input.agentName);
  const stackLower = input.stack.toLowerCase();
  const lang: 'typescript' | 'python' | 'go' =
    /python|fastapi|django|flask/.test(stackLower) ? 'python' :
    /\bgo\b|golang|gin|fiber/.test(stackLower)      ? 'go'     :
                                                      'typescript';

  const codeByLang = {
    typescript: `import { AgentMint } from '@agentmint/sdk';

const am = new AgentMint({ apiKey: process.env.AGENTMINT_KEY! });

// In your ${input.agentName} route, before the agent runs:
const decision = await am.authorize({
  workspaceId,
  product: '${product}',
  action:  '${action}',
  cost:    1,
});
if (!decision.allow) return Response.json(decision, { status: 402 });

const result = await run${input.agentName.replace(/[^a-zA-Z]/g, '')}();   // your agent logic

// On success:
await am.debit({
  workspaceId,
  product: '${product}',
  action:  '${action}',
  cost:    1,
  resourceId: result.id,
});`,

    python: `from agentmint import AgentMint
am = AgentMint(api_key=os.environ["AGENTMINT_KEY"])

# In your ${input.agentName} handler, before the agent runs:
d = am.authorize(workspace_id=workspace_id, product="${product}", action="${action}", cost=1)
if not d.allow:
    return jsonify(d.dict()), 402

result = run_${product}()   # your agent logic

# On success:
am.debit(workspace_id=workspace_id, product="${product}",
         action="${action}", cost=1, resource_id=result.id)`,

    go: `import am "github.com/nagarmohnish/agentmint-go"

c, _ := am.New(os.Getenv("AGENTMINT_KEY"))

// In your ${input.agentName} handler, before the agent runs:
d, err := c.Authorize(ctx, am.AuthorizeArgs{
    WorkspaceID: workspaceID, Product: "${product}", Action: "${action}", Cost: 1,
})
if !d.Allow { writeJSON(w, 402, d); return }

result := run${product}() // your agent logic

// On success:
c.Debit(ctx, am.DebitArgs{
    AuthorizeArgs: am.AuthorizeArgs{WorkspaceID: workspaceID, Product: "${product}", Action: "${action}", Cost: 1},
    ResourceID:    result.ID,
})`,
  };

  return {
    estimatedHours: 1,
    language: lang,
    steps: [
      { title: 'Provision your workspace',        description: 'We spin up an AgentMint tenant for you; you generate an API key in the builder console.' },
      { title: `Register ${input.agentName}`,     description: `Add one row to the registry for each action ${input.agentName} exposes. Cost lives in the registry, not in your code.` },
      { title: 'Wrap your agent route',           description: 'Drop authorize() before the agent runs, debit() on success. Two HTTP calls. Same shape regardless of stack.' },
      { title: 'Connect your Stripe',             description: 'OAuth into your Stripe account; payouts go straight to your bank. AgentMint never holds the money.' },
      { title: 'Test the 402 path',               description: 'Hit it with a zero-balance workspace and you should get a structured 402 with the upgrade payload.' },
    ],
    codeSnippet: codeByLang[lang],
  };
}

export function buildTemplatePlan(input: ApplicationInput): MonetizationPlan {
  const mode = MODE_FROM_PREF[input.billingPref];
  const tiers = buildTiers(input, mode);
  const projections = computeProjections(input, tiers);
  const integration = buildIntegration(input);

  const billingLabel = BILLING_LABELS[input.billingPref];
  const geoLabel     = GEOGRAPHY_LABELS[input.geography];

  return {
    headline: mode === 'usage'
      ? `Usage-based invoicing is the right call for ${input.agentName}.`
      : mode === 'hybrid'
      ? `${input.agentName} should ship prepaid credits with a usage-based escalation path.`
      : `A prepaid credit wallet fits ${input.agentName} best.`,

    reasoning: `You're at ${LIFECYCLE_LABELS[input.lifecycle].toLowerCase()} with ${VOLUME_LABELS[input.volumeEstimate]}. You asked for ${billingLabel.toLowerCase()}, serving ${geoLabel.toLowerCase()}. We picked ${mode === 'prepaid' ? 'prepaid credits' : mode === 'usage' ? 'usage-based invoicing' : 'a prepaid-with-usage-tier hybrid'} because it matches that customer expectation and your volume band.`,

    recommendedMode: mode,
    modeJustification: mode === 'prepaid'
      ? 'Prepaid credit wallets are the easiest model for end-users to reason about — top up once, spend across every agent action, stop when the balance hits zero. No surprise bills. No collections risk. The 402 paywall doubles as your upsell trigger.'
      : mode === 'usage'
      ? 'Usage-based makes sense when customers already understand metered pricing or when individual agent calls are expensive enough to demand per-call accounting. Card-on-file via Stripe; invoice at month end.'
      : 'Hybrid lets price-sensitive customers self-serve with credits while letting larger accounts negotiate usage-based with NET-30 terms. Same authorize/debit contract; you flip a flag per workspace.',

    tiers,
    projections,
    integration,
    nextActions: [
      { title: 'Provision your sandbox',  description: 'We spin up a real AgentMint tenant for you in the builder console.', cta: 'Open builder console', href: '/build/signup' },
      { title: 'Book a 20-minute working session', description: 'A real implementation call — not a sales call — to wire authorize() + debit() into your stack live.', cta: 'Reply to our email' },
      { title: 'Share this plan',         description: 'Forward this URL to anyone on your team. The link works without login.', cta: 'Copy URL' },
    ],
    generatedBy: 'template',
    generatedAt: new Date().toISOString(),
  };
}
