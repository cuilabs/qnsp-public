# qnsp — Python SDK for the Quantum-Native Security Platform

[![PyPI version](https://img.shields.io/pypi/v/qnsp.svg)](https://pypi.org/project/qnsp/)
[![Python versions](https://img.shields.io/pypi/pyversions/qnsp.svg)](https://pypi.org/project/qnsp/)
[![License](https://img.shields.io/pypi/l/qnsp.svg)](./LICENSE)

Typed Python client for QNSP — post-quantum cryptography (ML-KEM, ML-DSA, SLH-DSA, Falcon via liboqs), PQC-encrypted vault, server-side KMS, immutable audit trails. Same wire contracts as the official `@qnsp/*` TypeScript SDKs — pick whichever language fits your stack and the byte-for-byte outputs round-trip.

> **Free tier available.** Free-forever account at <https://cloud.qnsp.cuilabs.io/auth> — 60-second signup, no credit card. Includes 10 GB PQC storage, 50 000 API calls/month, 20 KMS keys, 25 vault secrets.

## Installation

Base install (HTTP clients for vault, KMS, audit):

```bash
pip install qnsp
```

With local PQC primitives (`qnsp.crypto` — wraps `liboqs-python` 0.12.0):

```bash
pip install 'qnsp[crypto]'
```

`liboqs-python` requires the `liboqs` C library available on the host. Easiest paths:

| Platform | Command |
| --- | --- |
| macOS | `brew install liboqs` |
| Debian/Ubuntu | `apt install liboqs-dev` |
| From source | `cmake -DBUILD_SHARED_LIBS=ON ...` — see <https://github.com/open-quantum-safe/liboqs> |

(A v0.3.x release will ship `cibuildwheel`-built wheels that bundle a self-contained liboqs binary, removing the system prerequisite.)

Requires Python 3.10+ and `httpx`. Tested on CPython 3.10, 3.11, 3.12, 3.13.

## Quick start

```python
import os
import base64

from qnsp import QnspClient

with QnspClient(api_key=os.environ["QNSP_API_KEY"]) as qnsp:
    # ── Vault — PQC-encrypted secret storage ─────────────────────────
    secret = qnsp.vault.create_secret(
        name="openai-api-key",
        payload_b64=base64.b64encode(b"sk-...").decode(),
        algorithm="ml-kem-768",
    )
    fresh = qnsp.vault.get_secret(secret["id"])

    # ── KMS — server-side PQC keys ──────────────────────────────────
    key = qnsp.kms.create_key(algorithm="ml-dsa-65", purpose="signing")
    signature = qnsp.kms.sign(key["keyId"], data=b"hello")
    assert qnsp.kms.verify(key["keyId"], data=b"hello", signature=signature)

    # ── Audit — immutable, hash-chained event log ───────────────────
    qnsp.audit.log_event(
        event_type="model.inference",
        payload={"modelId": "gpt-4o", "latencyMs": 412},
    )

    # ── New in 0.3.0 — full parity with Go and Rust SDKs ────────────
    qnsp.tenant.get_tenant(qnsp.tenant_id)
    qnsp.access.check_permission(subject_id="user-1", permission="vault.read")
    qnsp.billing.get_entitlements()
    qnsp.crypto_inventory.get_readiness_score(qnsp.tenant_id)
    qnsp.storage.put_object("uploads", "report.pdf", data=b"...")
    qnsp.search.query("docs", vector=[0.1] * 768, top_k=5)
    qnsp.ai.invoke_inference(model_id="gpt-4o", input={"prompt": "..."})
    qnsp.auth.login(email="user@example.com", password="...", tenant_id=qnsp.tenant_id)
```

## Local PQC primitives

`qnsp.crypto` wraps `liboqs-python` so you don't have to write `oqs` calls yourself, and so the algorithm-name surface matches the rest of the QNSP ecosystem (TypeScript, Go, Rust):

```python
from qnsp.crypto import MlKem, MlDsa, SlhDsa, Falcon

# Module-Lattice KEM (FIPS 203)
kem = MlKem("ML-KEM-768")
pk, sk = kem.keygen()
enc = kem.encapsulate(pk)
recovered = kem.decapsulate(enc.ciphertext, sk)
assert recovered == enc.shared_secret

# Module-Lattice signatures (FIPS 204)
sig = MlDsa("ML-DSA-65")
sig_pk, sig_sk = sig.keygen()
signature = sig.sign(b"hello", sig_sk)
assert sig.verify(b"hello", signature, sig_pk)

# Stateless hash-based signatures (FIPS 205) — conservative, no lattice assumption
slh = SlhDsa("SLH-DSA-SHA2-128f")

# Compact lattice signatures (NIST PQC selection)
fal = Falcon("Falcon-512")
```

Sizes match the FIPS specs exactly (the SDK reads them from the linked liboqs build, so no inline literals drift).

## Verifying inbound webhooks

QNSP signs every webhook with HMAC-SHA-256. Verify the **raw body** before parsing JSON:

```python
from fastapi import FastAPI, Request, HTTPException
from qnsp import parse_qnsp_webhook, QnspWebhookError

app = FastAPI()

@app.post("/webhooks/qnsp")
async def receive(request: Request) -> dict:
    body = await request.body()
    try:
        event = parse_qnsp_webhook(
            body=body,
            signature_header=request.headers.get("x-qnsp-signature", ""),
            timestamp_header=request.headers.get("x-qnsp-timestamp"),
            secret=os.environ["QNSP_WEBHOOK_SECRET"],
        )
    except QnspWebhookError as exc:
        raise HTTPException(400, str(exc))

    if event.event_type == "key.rotated":
        ...
    return {"ok": True}
```

The verifier runs HMAC comparison in constant time, rejects timestamps older than 5 minutes by default (replay protection), and refuses payloads missing required fields.

## Error handling

All errors descend from `qnsp.QnspError`:

| Class | When |
| --- | --- |
| `QnspNetworkError` | DNS, TLS, timeout, or connection failure |
| `QnspAuthError` | API key rejected at activation |
| `QnspApiError` | A service returned 4xx/5xx with a structured body |
| `QnspWebhookError` | HMAC mismatch, expired timestamp, malformed body, etc. |

```python
from qnsp import QnspApiError, QnspNetworkError

try:
    qnsp.vault.get_secret("missing")
except QnspApiError as exc:
    print("HTTP", exc.status_code, exc.code, exc.body)
except QnspNetworkError as exc:
    print("Could not reach QNSP:", exc)
```

## Activation + tier introspection

`QnspClient` performs a one-shot handshake against `/billing/v1/sdk/activate` on first use. The result is cached in memory; subsequent calls reuse it until ~1 minute before expiry. You can inspect the current activation:

```python
qnsp.tenant_id        # resolved tenant
qnsp.tier             # plan tier
qnsp.limits           # full limits dict
qnsp.has_feature("sseEnabled")  # convenience boolean
```

If the activation token is rotated server-side, the SDK invalidates its cache and retries the originating request once on a 401.

## What's covered today (v0.3.0 — full parity with Go and Rust SDKs)

Customer-facing service modules — every QNSP service callable through the edge gateway:

- `qnsp.vault` — secrets management (create / get / get-version / rotate / delete / list-versions)
- `qnsp.kms` — server-side PQC keys (create / list / get / rotate / delete / sign / verify / wrap / unwrap)
- `qnsp.audit` — immutable hash-chained event log (log-event / ingest-events / list-events)
- `qnsp.auth` — login, refresh, revoke, WebAuthn passkeys, MFA, SAML/OIDC federation, risk-based auth
- `qnsp.tenant` — tenant CRUD, crypto-policy management, current-health, current-quotas
- `qnsp.access` — RBAC roles, role assignments, `check_permission`
- `qnsp.billing` — entitlements, usage meters (single + batch), invoice listing, credit balance
- `qnsp.crypto_inventory` — Cryptographic Bill of Materials: assets, discovery runs, PQC readiness
- `qnsp.storage` — PQC-encrypted object storage with SSE-X
- `qnsp.search` — encrypted vector search (index lifecycle, `upsert_vectors`, `query`)
- `qnsp.ai` — model registry, AI workloads with enclave attestation, `invoke_inference`, artifacts

Local primitives + integration:

- `qnsp.crypto` (requires `qnsp[crypto]`) — ML-KEM (512/768/1024), ML-DSA (44/65/87), SLH-DSA (8 variants), Falcon (512/1024), plus HQC, BIKE, FrodoKEM, Classic-McEliece, MAYO, CROSS — every FIPS 203/204/205 finalist exposed by liboqs 0.12.0
- `qnsp.parse_qnsp_webhook` / `qnsp.verify_qnsp_webhook_signature` — HMAC-SHA-256 verify + replay protection
- `qnsp.QnspClient` — API-key activation with caching and 401 retry

## What's coming

- `AsyncQnspClient` — native-async variants using `httpx.AsyncClient`
- A `pytest` plugin that mocks the QNSP API for tests in your codebase
- Generated typed responses (currently `dict[str, Any]`) for every method

## License

Apache-2.0. See [LICENSE](./LICENSE).
