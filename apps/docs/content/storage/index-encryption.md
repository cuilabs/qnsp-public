---
title: Index Encryption
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Index Encryption

Search indexes are encrypted to protect query patterns.

## Index structure

```
Encrypted Index Entry:
  - Token: HMAC(key, term)
  - Pointer: Encrypted document reference
  - Metadata: Encrypted auxiliary data
```

## Token generation

Search tokens derived using:
```
token = HMAC-SHA3-256(index_key, term)
```

- Deterministic for matching
- Key per tenant
- Rotatable

## Index key management

### Key hierarchy
```
Tenant KEK
    ↓
Index Master Key
    ↓
Per-Index Key
```

### Rotation
- Generate new index key
- Re-index documents (background)
- Old tokens invalidated

## Query privacy

### What server learns
- Number of matching documents
- Access pattern (which tokens queried)

### What server doesn't learn
- Plaintext query terms
- Document contents
- Non-matching terms

## Leakage mitigation

### Padding
- Fixed-size tokens
- Dummy entries

### Obfuscation
- Query batching
- Decoy queries

## Performance

| Operation | Overhead |
|-----------|----------|
| Index write | ~5ms per term |
| Index read | ~2ms per token |
| Re-indexing | Background, hours for large datasets |
