---
title: Python SDK
version: 0.2.0
last_updated: 2026-04-30
copyright: © 2025-2026 CUI Labs. All rights reserved.
---
# Python SDK

Single `qnsp` package on PyPI ([source](https://github.com/cuilabs/qnsp-public/tree/main/sdks/python/qnsp), [changelog](https://github.com/cuilabs/qnsp-public/blob/main/sdks/python/qnsp/CHANGELOG.md)).

## Installation

```bash
pip install qnsp
```

For local PQC primitives (`qnsp.crypto`, wrapping `liboqs-python` 0.12.0):

```bash
pip install 'qnsp[crypto]'
```

`liboqs-python` requires the `liboqs` C library:

| Platform | Command |
| --- | --- |
| macOS | `brew install liboqs` |
| Debian/Ubuntu | `apt install liboqs-dev` |
| From source | <https://github.com/open-quantum-safe/liboqs> |

Requires Python 3.10+. Tested on CPython 3.10, 3.11, 3.12, 3.13.

## Quick start

```python
import os, base64
from qnsp import QnspClient

with QnspClient(api_key=os.environ["QNSP_API_KEY"]) as qnsp:
    # Vault — PQC-encrypted secret storage
    secret = qnsp.vault.create_secret(
        name="openai-api-key",
        payload_b64=base64.b64encode(b"sk-...").decode(),
        algorithm="ml-kem-768",
    )

    # KMS — server-side PQC keys
    key = qnsp.kms.create_key(algorithm="ml-dsa-65", purpose="signing")
    sig = qnsp.kms.sign(key["keyId"], data=b"hello")
    assert qnsp.kms.verify(key["keyId"], data=b"hello", signature=sig)

    # Audit — immutable, hash-chained event log
    qnsp.audit.log_event(
        event_type="model.inference",
        payload={"modelId": "gpt-4o", "latencyMs": 412},
    )
```

## Local PQC primitives

```python
from qnsp.crypto import MlKem, MlDsa, SlhDsa, Falcon

kem = MlKem("ML-KEM-768")
pk, sk = kem.keygen()
enc    = kem.encapsulate(pk)
assert kem.decapsulate(enc.ciphertext, sk) == enc.shared_secret
```

## Webhook verification

```python
from qnsp import parse_qnsp_webhook
event = parse_qnsp_webhook(
    body=raw_body,
    signature_header=request.headers["x-qnsp-signature"],
    timestamp_header=request.headers["x-qnsp-timestamp"],
    secret=os.environ["QNSP_WEBHOOK_SECRET"],
)
```

HMAC-SHA-256 verify, 5-minute replay window by default, typed `QnspWebhookEvent` return.

## Activation + introspection

```python
qnsp.tenant_id              # resolved tenant
qnsp.tier                   # plan tier
qnsp.limits                 # full limits dict
qnsp.has_feature("sseEnabled")
```

## What's covered today

- `qnsp.crypto` — ML-KEM, ML-DSA, SLH-DSA, Falcon (full liboqs 0.12.0 surface) — see [`src/qnsp/crypto/`](https://github.com/cuilabs/qnsp-public/tree/main/sdks/python/qnsp/src/qnsp/crypto)
- `qnsp.vault` — [`src/qnsp/vault.py`](https://github.com/cuilabs/qnsp-public/blob/main/sdks/python/qnsp/src/qnsp/vault.py)
- `qnsp.kms` — [`src/qnsp/kms.py`](https://github.com/cuilabs/qnsp-public/blob/main/sdks/python/qnsp/src/qnsp/kms.py)
- `qnsp.audit` — [`src/qnsp/audit.py`](https://github.com/cuilabs/qnsp-public/blob/main/sdks/python/qnsp/src/qnsp/audit.py)
- Webhook verify + parse, API-key activation with caching and 401 retry

## What's coming in v0.3.0

To match the Go and Rust v0.1.0 surface, the Python package will gain:

- `qnsp.tenant` — tenant CRUD and crypto-policy management
- `qnsp.access` — RBAC roles and permissions
- `qnsp.billing` — entitlements, usage meters, invoices
- `qnsp.crypto_inventory` — CBOM
- `qnsp.storage` — PQC-encrypted object storage (SSE-X)
- `qnsp.search` — encrypted vector search

In the meantime, you can call those services directly via `httpx` against `https://api.qnsp.cuilabs.io/proxy/<service>/...` using the same auth header the SDK uses (`authorization: Bearer <api_key>`).
