# @qnsp/shared-kernel

Shared domain primitives, schemas, and utilities used across the Quantum-Native Security Platform (QNSP).

## Exports

- `createAuthSubject`, `createAccessToken`, `createJwtAccessToken`, `accessTokenSchema` — helpers for JWT token claims and subject modelling.
- `signJwt`, `verifyJwt`, `createJwtVerifier` — PQC-JWT signing and verification functions using Dilithium or other PQC signature algorithms.
- `CLASSIFICATION_LEVELS`, `TOKEN_AUDIENCES`, `DEFAULT_TOKEN_TTL_SECONDS` — shared constants.
- `ApplicationError`, `DomainError`, `UnauthorizedError`, `ForbiddenError` — standardized error hierarchy.
- `createHealthStatus`, `healthStatusSchema` — helper for constructing standardized health responses.

## Scripts

```bash
pnpm build     # Compile TypeScript to dist/
pnpm lint      # Run Biome checks
pnpm test      # Execute Vitest test suites
pnpm typecheck # Run TypeScript without emitting output
```

© 2025 QNSP - CUI LABS, Singapore
