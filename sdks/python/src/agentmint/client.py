from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

import httpx

DEFAULT_BASE = "https://api.agentmint.com"


class AgentMintError(Exception):
    def __init__(self, status: int, message: str, code: Optional[str] = None):
        super().__init__(message)
        self.status = status
        self.code = code


@dataclass
class AuthorizeResult:
    allow: bool
    reason: Optional[str] = None
    balance: Optional[int] = None
    upgrade: Optional[dict] = None


@dataclass
class DebitResult:
    ok: bool
    transaction_id: str
    balance: int
    idempotent: bool = False


class AgentMint:
    """AgentMint client. Wraps /v1/authorize and /v1/debit."""

    def __init__(self, api_key: str, base_url: str = DEFAULT_BASE, timeout: float = 10.0):
        if not api_key:
            raise ValueError("AgentMint: api_key is required")
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")
        self._client = httpx.Client(timeout=timeout)

    def authorize(self, *, workspace_id: str, product: str, action: str, cost: int) -> AuthorizeResult:
        data = self._post("/v1/authorize", {
            "workspaceId": workspace_id,
            "product": product,
            "action": action,
            "cost": cost,
        })
        return AuthorizeResult(
            allow=bool(data.get("allow")),
            reason=data.get("reason"),
            balance=data.get("balance"),
            upgrade=data.get("upgrade"),
        )

    def debit(self, *, workspace_id: str, product: str, action: str, cost: int,
              resource_id: str, idempotency_key: Optional[str] = None) -> DebitResult:
        headers = {"Idempotency-Key": idempotency_key} if idempotency_key else {}
        data = self._post("/v1/debit", {
            "workspaceId": workspace_id,
            "product": product,
            "action": action,
            "cost": cost,
            "resourceId": resource_id,
        }, headers)
        return DebitResult(
            ok=bool(data.get("ok")),
            transaction_id=data.get("transactionId", ""),
            balance=int(data.get("balance", 0)),
            idempotent=bool(data.get("idempotent", False)),
        )

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "AgentMint":
        return self

    def __exit__(self, *_: Any) -> None:
        self.close()

    def _post(self, path: str, body: dict, extra_headers: Optional[dict] = None) -> dict:
        headers = {
            "content-type": "application/json",
            "authorization": f"Bearer {self._api_key}",
        }
        if extra_headers:
            headers.update(extra_headers)
        res = self._client.post(self._base_url + path, json=body, headers=headers)
        try:
            data = res.json()
        except Exception:
            data = {}
        if res.status_code >= 400:
            message = data.get("message") or data.get("error") or res.reason_phrase
            raise AgentMintError(res.status_code, message, data.get("code"))
        return data
