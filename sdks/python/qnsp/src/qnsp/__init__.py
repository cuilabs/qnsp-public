"""QNSP — official Python SDK for the Quantum-Native Security Platform.

Mirrors the surface of the ``@qnsp/*`` TypeScript SDK family for the Python
ecosystem. Same wire contracts, same algorithm names, same FIPS 203/204/205
posture — pick whichever language fits your stack and the byte-for-byte
outputs round-trip.

Quick start::

    from qnsp import QnspClient

    qnsp = QnspClient(api_key=os.environ["QNSP_API_KEY"])

    # Vault
    secret = qnsp.vault.create_secret(
        name="openai-key",
        payload_b64=base64.b64encode(b"sk-...").decode(),
    )

    # KMS
    key = qnsp.kms.create_key(algorithm="ml-dsa-65", purpose="signing")
    sig = qnsp.kms.sign(key["keyId"], data=b"hello")

    # Audit
    qnsp.audit.log_event(event_type="model.inference", payload={"modelId": "gpt-4o"})

Local PQC primitives (requires ``qnsp[crypto]``)::

    from qnsp.crypto import MlKem, MlDsa

    kem = MlKem("ML-KEM-768")
    pk, sk = kem.keygen()
    enc = kem.encapsulate(pk)
    assert kem.decapsulate(enc.ciphertext, sk) == enc.shared_secret

Webhook verification::

    from qnsp import parse_qnsp_webhook, QnspWebhookError

    event = parse_qnsp_webhook(
        body=raw_body,
        signature_header=request.headers["x-qnsp-signature"],
        timestamp_header=request.headers["x-qnsp-timestamp"],
        secret=os.environ["QNSP_WEBHOOK_SECRET"],
    )

Free signup at https://cloud.qnsp.cuilabs.io/auth — no credit card.
"""

from qnsp._client import QnspClient
from qnsp._errors import (
    QnspApiError,
    QnspAuthError,
    QnspError,
    QnspNetworkError,
    QnspWebhookError,
)
from qnsp.access import AccessClient
from qnsp.ai import AIClient
from qnsp.audit import AuditClient
from qnsp.auth import AuthClient
from qnsp.billing import BillingClient
from qnsp.crypto_inventory import CryptoInventoryClient
from qnsp.kms import KmsClient
from qnsp.search import SearchClient
from qnsp.storage import StorageClient
from qnsp.tenant import TenantClient
from qnsp.vault import VaultClient
from qnsp.webhooks import (
    QnspWebhookEvent,
    parse_qnsp_webhook,
    verify_qnsp_webhook_signature,
)

__version__ = "0.3.0"

__all__ = [
    "AccessClient",
    "AIClient",
    "AuditClient",
    "AuthClient",
    "BillingClient",
    "CryptoInventoryClient",
    "KmsClient",
    "QnspApiError",
    "QnspAuthError",
    "QnspClient",
    "QnspError",
    "QnspNetworkError",
    "QnspWebhookError",
    "QnspWebhookEvent",
    "SearchClient",
    "StorageClient",
    "TenantClient",
    "VaultClient",
    "parse_qnsp_webhook",
    "verify_qnsp_webhook_signature",
]
