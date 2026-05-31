"""KMS client — server-side PQC key management.

Mirrors the most-used methods of ``@cuilabs/qnsp-kms-client`` from the TypeScript
SDK family. Routes verified against ``apps/kms-service/src/routes/keys.ts``:

  POST   /kms/v1/keys                 — createKey
  GET    /kms/v1/keys                 — listKeys
  GET    /kms/v1/keys/{keyId}         — getKey
  POST   /kms/v1/keys/{keyId}/wrap    — wrapKey
  POST   /kms/v1/keys/{keyId}/unwrap  — unwrapKey
  POST   /kms/v1/keys/{keyId}/sign    — signData
  POST   /kms/v1/keys/{keyId}/verify  — verifySignature
  POST   /kms/v1/keys/{keyId}/rotate  — rotateKey
  DELETE /kms/v1/keys/{keyId}         — deleteKey

Server-side keys are tenant-scoped, tier-gated, and (where supported)
backed by an HSM. For local in-process PQC primitives use ``qnsp.crypto``;
that module wraps liboqs-python directly with no server round-trip.
"""

from __future__ import annotations

import base64
from typing import Any

from qnsp._service import _ServiceClient


class KmsClient(_ServiceClient):
    """Server-side KMS client.

    Methods accept bytes for any cryptographic input (data, signatures,
    public keys); the client base64-encodes them for the wire and the
    response decodes back where appropriate.
    """

    PATH_PREFIX = "/kms/v1"

    # ── lifecycle ─────────────────────────────────────────────────────────

    def create_key(
        self,
        *,
        algorithm: str,
        purpose: str = "signing",
        tenant_id: str | None = None,
        label: str | None = None,
        metadata: dict[str, Any] | None = None,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        """Create a new tenant-scoped key.

        Args:
            algorithm: PQC algorithm name — e.g. ``"ml-kem-768"``,
                ``"ml-dsa-65"``, ``"slh-dsa-sha2-128f"``, ``"falcon-512"``.
            purpose: ``"signing"`` (default), ``"encryption"``, or
                ``"key-wrapping"``.
            label: Human-readable label.
        """
        body: dict[str, Any] = {"algorithm": algorithm, "purpose": purpose}
        if tenant_id:
            body["tenantId"] = tenant_id
        if label:
            body["label"] = label
        if metadata:
            body["metadata"] = metadata
        return self._request("POST", "/keys", json=body, idempotency_key=idempotency_key)

    def list_keys(
        self,
        *,
        tenant_id: str | None = None,
        limit: int | None = None,
        cursor: str | None = None,
    ) -> dict[str, Any]:
        return self._request(
            "GET",
            "/keys",
            query={"tenantId": tenant_id, "limit": limit, "cursor": cursor},
        )

    def get_key(self, key_id: str, *, tenant_id: str | None = None) -> dict[str, Any]:
        return self._request(
            "GET", f"/keys/{key_id}", query={"tenantId": tenant_id}
        )

    def rotate_key(
        self,
        key_id: str,
        *,
        idempotency_key: str | None = None,
    ) -> dict[str, Any]:
        return self._request(
            "POST", f"/keys/{key_id}/rotate", idempotency_key=idempotency_key
        )

    def delete_key(self, key_id: str, *, tenant_id: str) -> None:
        self._request("DELETE", f"/keys/{key_id}", query={"tenantId": tenant_id})

    # ── crypto operations ────────────────────────────────────────────────

    def sign(
        self,
        key_id: str,
        data: bytes,
        *,
        idempotency_key: str | None = None,
    ) -> bytes:
        """Sign ``data`` with the named server-side key.

        Returns the signature as raw bytes. The wire payload uses base64.
        """
        if not isinstance(data, (bytes, bytearray)):
            raise TypeError("data must be bytes")
        body = {"dataBase64": base64.b64encode(bytes(data)).decode()}
        result = self._request(
            "POST",
            f"/keys/{key_id}/sign",
            json=body,
            idempotency_key=idempotency_key,
        )
        sig_b64 = result.get("signatureBase64") or result.get("signature_base64")
        if not isinstance(sig_b64, str):
            raise ValueError("KMS sign response missing signatureBase64")
        return base64.b64decode(sig_b64)

    def verify(self, key_id: str, data: bytes, signature: bytes) -> bool:
        """Verify ``signature`` over ``data`` against the named server-side key."""
        if not isinstance(data, (bytes, bytearray)):
            raise TypeError("data must be bytes")
        if not isinstance(signature, (bytes, bytearray)):
            raise TypeError("signature must be bytes")
        body = {
            "dataBase64": base64.b64encode(bytes(data)).decode(),
            "signatureBase64": base64.b64encode(bytes(signature)).decode(),
        }
        result = self._request("POST", f"/keys/{key_id}/verify", json=body)
        return bool(result.get("valid", False))

    def wrap(self, key_id: str, plaintext: bytes) -> bytes:
        """Wrap (encrypt) plaintext using the named server-side key.

        The server returns the wrapped blob — opaque to the caller. Pair
        with :meth:`unwrap` to recover the plaintext.
        """
        if not isinstance(plaintext, (bytes, bytearray)):
            raise TypeError("plaintext must be bytes")
        body = {"plaintextBase64": base64.b64encode(bytes(plaintext)).decode()}
        result = self._request("POST", f"/keys/{key_id}/wrap", json=body)
        wrapped_b64 = result.get("wrappedBase64") or result.get("wrapped_base64")
        if not isinstance(wrapped_b64, str):
            raise ValueError("KMS wrap response missing wrappedBase64")
        return base64.b64decode(wrapped_b64)

    def unwrap(self, key_id: str, wrapped: bytes) -> bytes:
        """Unwrap a previously-wrapped blob to recover the plaintext."""
        if not isinstance(wrapped, (bytes, bytearray)):
            raise TypeError("wrapped must be bytes")
        body = {"wrappedBase64": base64.b64encode(bytes(wrapped)).decode()}
        result = self._request("POST", f"/keys/{key_id}/unwrap", json=body)
        plain_b64 = result.get("plaintextBase64") or result.get("plaintext_base64")
        if not isinstance(plain_b64, str):
            raise ValueError("KMS unwrap response missing plaintextBase64")
        return base64.b64decode(plain_b64)
