# agentmint

One credit wallet across your whole AI-agent suite. Two calls: `authorize()` before the agent runs, `debit()` after success.

## Install

```bash
pip install agentmint
```

## Use

```python
from agentmint import AgentMint

am = AgentMint(api_key="am_live_...")

d = am.authorize(workspace_id="ws_ac82", product="writer", action="generate_doc", cost=25)
if not d.allow:
    raise RuntimeError(d.reason)

# run your agent...

am.debit(workspace_id="ws_ac82", product="writer", action="generate_doc",
         cost=25, resource_id="doc_91a")
```

Idempotency: pass the same `resource_id` twice and the second call is a no-op.
