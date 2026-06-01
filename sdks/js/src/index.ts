export interface AgentMintOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export interface AuthorizeArgs {
  workspaceId: string;
  product: string;
  action: string;
  cost: number;
}

export interface DebitArgs extends AuthorizeArgs {
  resourceId: string;
  idempotencyKey?: string;
}

export interface AuthorizeResult {
  allow: boolean;
  reason?: 'INSUFFICIENT_CREDITS' | 'PLAN_GATED' | 'UNKNOWN_ACTION';
  balance?: number;
  upgrade?: { plan: string; price: number; currency: string };
}

export interface DebitResult {
  ok: boolean;
  transactionId: string;
  balance: number;
  idempotent?: boolean;
}

export class AgentMintError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'AgentMintError';
    this.status = status;
    this.code = code;
  }
}

const DEFAULT_BASE = 'https://api.agentmint.com';

export class AgentMint {
  private apiKey: string;
  private baseUrl: string;
  private fetchImpl: typeof globalThis.fetch;

  constructor(opts: AgentMintOptions) {
    if (!opts.apiKey) throw new Error('AgentMint: apiKey is required');
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/$/, '');
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) throw new Error('AgentMint: fetch is not available; pass one via options.fetch');
  }

  authorize(args: AuthorizeArgs): Promise<AuthorizeResult> {
    return this.post<AuthorizeResult>('/v1/authorize', args);
  }

  debit(args: DebitArgs): Promise<DebitResult> {
    const headers: Record<string, string> = {};
    if (args.idempotencyKey) headers['Idempotency-Key'] = args.idempotencyKey;
    return this.post<DebitResult>('/v1/debit', args, headers);
  }

  private async post<T>(path: string, body: unknown, extraHeaders: Record<string, string> = {}): Promise<T> {
    const res = await this.fetchImpl(this.baseUrl + path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = (data && (data.message || data.error)) || res.statusText;
      throw new AgentMintError(res.status, message, data?.code);
    }
    return data as T;
  }
}

export default AgentMint;
