# AgentMint SDKs

Three official client libraries. All wrap the same two-endpoint contract.

| Language | Package | Path |
|---|---|---|
| TypeScript / JavaScript | `@agentmint/sdk` | [`sdks/js/`](js/) |
| Python | `agentmint` (PyPI) | [`sdks/python/`](python/) |
| Go | `github.com/nagarmohnish/agentmint-go` | [`sdks/go/`](go/) |

All three expose two methods: `authorize()` (plan + balance check) and `debit()` (atomic, idempotent by `resourceId`). They mirror the raw HTTP contract — anything that speaks HTTPS can still bill through AgentMint without using an SDK.

## Design constraints

- **Zero heavy deps.** JS uses `globalThis.fetch`. Python uses `httpx`. Go uses `net/http`.
- **Same shape across languages.** The argument names match (`workspaceId`/`workspace_id`/`WorkspaceID` per idiom); the response shape is identical.
- **Errors are structured.** `AgentMintError` / `agentmint.Error` carry `status` + `code` (`INSUFFICIENT_CREDITS`, `PLAN_GATED`, `UNKNOWN_ACTION`).
- **Idempotency is first-class.** `resourceId` deduplicates by resource. `idempotencyKey` deduplicates retries before the resource exists.

## Versioning

All three SDKs are at `0.1.0` (pilot). The HTTP contract is `v1` and stable.
