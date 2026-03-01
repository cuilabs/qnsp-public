---
title: Key Usage
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Key Usage

QNSP enforces strict key usage policies.

## Usage constraints

Keys are constrained by:
- **Purpose**: encrypt, decrypt, sign, verify, wrap, derive
- **Algorithm**: Must match key type
- **Scope**: Tenant, service, or resource bound

## Operations

### Encryption
```
POST /kms/v1/encrypt
{
  "keyId": "key-uuid",
  "plaintext": "base64-encoded-data",
  "context": {"purpose": "storage"}
}
```

### Decryption
```
POST /kms/v1/decrypt
{
  "keyId": "key-uuid",
  "ciphertext": "base64-encoded-data",
  "context": {"purpose": "storage"}
}
```

### Signing
```
POST /kms/v1/sign
{
  "keyId": "key-uuid",
  "message": "base64-encoded-data",
  "algorithm": "dilithium"
}
```

## Context binding

Encryption context binds ciphertext to purpose:
- Context must match on decrypt
- Prevents ciphertext misuse
- Included in AAD for AEAD

## Usage limits

Keys can have usage limits:
- Maximum operations count
- Time-based expiry
- Automatic rotation triggers

## Audit

All key operations are logged:
- Key ID
- Operation type
- Caller identity
- Timestamp
- Success/failure
