---
title: PQC Primitives Overview
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
license: BSL-1.1
source_files:
  - /packages/cryptography/src/provider.ts
  - /packages/shared-kernel/src/jwt.ts
---

# PQC Primitives Overview

QNSP implements NIST-standardized post-quantum cryptographic primitives via the `@qnsp/cryptography` package.

## Supported Algorithms

The `PqcAlgorithm` type defines all supported algorithms:

```typescript
// Source: packages/cryptography/src/provider.ts
type PqcAlgorithm =
  | "kyber-512" | "kyber-768" | "kyber-1024"      // KEM
  | "dilithium-2" | "dilithium-3" | "dilithium-5" // Signatures
  | "falcon-512" | "falcon-1024"                   // Signatures
  | "sphincs-shake-128f-simple"                    // Hash-based
  | "sphincs-shake-256f-simple";
```

## Signature Algorithms

| Algorithm | JWT Header | NIST Level | Use Case |
|-----------|------------|------------|----------|
| `dilithium-2` | `Dilithium2` | 2 | JWT signing (default) |
| `dilithium-3` | `Dilithium3` | 3 | High-security tokens |
| `dilithium-5` | `Dilithium5` | 5 | Maximum security |
| `falcon-512` | `Falcon512` | 1 | Size-constrained |
| `falcon-1024` | `Falcon1024` | 5 | Size-constrained, high security |
| `sphincs-shake-128f-simple` | `SPHINCS+-SHAKE-128f-simple` | 1 | Stateless hash-based |
| `sphincs-shake-256f-simple` | `SPHINCS+-SHAKE-256f-simple` | 5 | Stateless hash-based |

## Key Encapsulation (KEM)

| Algorithm | NIST Level | Use Case |
|-----------|------------|----------|
| `kyber-512` | 1 | Development/testing |
| `kyber-768` | 3 | Production default |
| `kyber-1024` | 5 | Maximum security |

## QNSP Defaults

From `apps/auth-service/src/config/env.ts`:

| Setting | Default Value |
|---------|---------------|
| `JWT_SIGNING_ALGORITHM` | `dilithium-2` |
| `AUTH_PQC_TLS_KEM_ALGORITHM` | `kyber-768` |
| `AUTH_PQC_TLS_SIGNATURE_ALGORITHM` | `dilithium-2` |

## Provider Interface

```typescript
// Source: packages/cryptography/src/provider.ts
interface PqcProvider {
  readonly name: string;
  generateKeyPair(options: GenerateKeyPairOptions): Promise<{ keyPair: PqcKeyPair }>;
  encapsulate(options: EncapsulateOptions): Promise<EncapsulationResult>;
  decapsulate(options: DecapsulateOptions): Promise<Uint8Array>;
  sign(options: SignOptions): Promise<SignatureResult>;
  verify(options: VerifyOptions): Promise<boolean>;
  hash(data: Uint8Array, algorithm?: string): Promise<HashResult>;
}
```

## Implementation

- **Production**: `liboqs` provider via `@cuilabs/liboqs-native`
- **Testing**: `deterministic-pqc` provider for reproducible tests
- Constant-time implementations
- Side-channel resistance
