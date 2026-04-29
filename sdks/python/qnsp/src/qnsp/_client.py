"""Top-level QNSP client.

A single ``QnspClient(api_key=...)`` exposes the whole platform via
sub-namespaces (``vault``, ``kms``, ``audit``, …). Local PQC primitives
live under ``qnsp.crypto`` and require the ``qnsp[crypto]`` extra.

Customer onboarding is identical for everyone — there are no per-partner
constructors. Anyone with a free QNSP API key (https://cloud.qnsp.cuilabs.io/auth)
gets the same surface.
"""

from __future__ import annotations

from typing import Any

import httpx

from qnsp._activation import (
    DEFAULT_BASE_URL,
    DEFAULT_TIMEOUT_SECONDS,
    ApiKeyActivation,
)
from qnsp.audit import AuditClient
from qnsp.kms import KmsClient
from qnsp.vault import VaultClient


class QnspClient:
    """End-user QNSP client. Pass an API key, get the full platform.

    Holds one HTTP connection pool and one activation cache; the
    sub-clients (``vault``, ``kms``, ``audit``) share both. ``QnspClient``
    is reentrant as a context manager and will release its pool on exit.

    Args:
        api_key: A ``qnsp_pqc_*`` API key from https://cloud.qnsp.cuilabs.io/api-keys.
        base_url: Override the QNSP edge-gateway URL. Defaults to production.
        timeout: Per-request timeout in seconds.
        http_client: Optional pre-configured ``httpx.Client`` (useful for
            shared connection pools or for injecting a transport in tests).
    """

    def __init__(
        self,
        *,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
        http_client: httpx.Client | None = None,
    ) -> None:
        self._http = http_client or httpx.Client(timeout=timeout)
        self._owned_http_client = http_client is None
        self._activation = ApiKeyActivation(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout,
            http_client=self._http,
        )
        self.vault = VaultClient(
            activation=self._activation, http_client=self._http, timeout=timeout
        )
        self.kms = KmsClient(
            activation=self._activation, http_client=self._http, timeout=timeout
        )
        self.audit = AuditClient(
            activation=self._activation, http_client=self._http, timeout=timeout
        )

    # ── activation introspection ─────────────────────────────────────────

    @property
    def tenant_id(self) -> str:
        """Tenant ID resolved by activation. Triggers activation on first call."""
        return self._activation.tenant_id

    @property
    def tier(self) -> str:
        """Plan tier resolved by activation."""
        return self._activation.tier

    @property
    def limits(self) -> dict[str, Any]:
        """Tier limits dict from activation."""
        return self._activation.limits

    def has_feature(self, feature: str) -> bool:
        """Whether the tenant's plan enables a billing-side boolean feature."""
        return self._activation.has_feature(feature)

    @property
    def base_url(self) -> str:
        return self._activation.base_url

    # ── lifecycle ─────────────────────────────────────────────────────────

    def close(self) -> None:
        if self._owned_http_client:
            self._http.close()

    def __enter__(self) -> QnspClient:
        return self

    def __exit__(self, *_exc: object) -> None:
        self.close()
