# @agentmint/sdk

One credit wallet across your whole AI-agent suite. Two calls: `authorize()` before the agent runs, `debit()` after success.

## Install

```bash
npm install @agentmint/sdk
```

## Use

```ts
import { AgentMint } from '@agentmint/sdk';

const am = new AgentMint({ apiKey: process.env.AGENTMINT_KEY! });

const decision = await am.authorize({
  workspaceId: 'ws_ac82',
  product: 'writer',
  action: 'generate_doc',
  cost: 25,
});
if (!decision.allow) throw new Error(decision.reason);

// run your agent...

await am.debit({
  workspaceId: 'ws_ac82',
  product: 'writer',
  action: 'generate_doc',
  cost: 25,
  resourceId: 'doc_91a',
});
```

Idempotency: pass the same `resourceId` twice and the second call is a no-op. Pass `idempotencyKey` to get the same guarantee for retries before the resource exists.

## Errors

`AgentMintError` carries `status` and `code` (e.g. `INSUFFICIENT_CREDITS`, `PLAN_GATED`).
