---
title: Security Assumptions
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Security Assumptions

Cryptographic assumptions underlying QNSP's PQC primitives.

## Lattice-based (Kyber, Dilithium)

### Module Learning With Errors (MLWE)
- Finding short vectors in module lattices is hard
- Even with quantum computers
- Well-studied since 2005

### Security reductions
- Kyber: IND-CCA2 security from MLWE
- Dilithium: EUF-CMA security from MLWE + SelfTargetMSIS

## Hash-based (SPHINCS+)

### Hash function security
- Collision resistance
- Second preimage resistance
- PRF security

### Minimal assumptions
- Only relies on hash function properties
- Most conservative choice

## NTRU-based (Falcon)

### NTRU assumption
- Finding short vectors in NTRU lattices is hard
- Older than MLWE (1996)
- Different mathematical structure

## Quantum security levels

| NIST Level | Equivalent to | Quantum security |
|------------|---------------|------------------|
| 1 | AES-128 | 64-bit quantum |
| 3 | AES-192 | 96-bit quantum |
| 5 | AES-256 | 128-bit quantum |

## Known attacks

### Lattice attacks
- BKZ algorithm
- Primal/dual attacks
- Hybrid attacks

### Mitigation
- Conservative parameter selection
- Regular security analysis review
- Algorithm agility for migration

## QNSP's position

- Use NIST Level 3 by default
- Monitor cryptanalysis developments
- Maintain algorithm agility
- Hybrid mode for defense in depth
