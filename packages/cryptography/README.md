# @qnsp/cryptography

Abstractions and helpers for post-quantum cryptography within the Quantum-Native Security Platform (QNSP). The package defines provider interfaces for key encapsulation, signatures, and hashing while enabling pluggable integrations with HSMs or PQC libraries.

## Usage

```ts
import { registerPqcProvider } from "@qnsp/cryptography";
import { initializeExternalPqcProvider } from "@qnsp/cryptography/providers";

const provider = await initializeExternalPqcProvider("qnsp-hsm-provider", {
  algorithms: ["kyber-768", "dilithium-3"],
  configuration: {
    endpoint: process.env.HSM_ENDPOINT
  }
});

registerPqcProvider(provider.name, provider);

const { keyPair } = await provider.generateKeyPair({ algorithm: "kyber-768" });
const signature = await provider.sign({
  algorithm: "dilithium-3",
  data: new TextEncoder().encode("hello"),
  privateKey: keyPair.privateKey
});
```

## Providers

`@qnsp/cryptography` ships two interchangeable PQC providers. Consumers pick the
one that matches their deployment profile.

### `noble` provider (default, pure-JS, always available)

The `noble` provider is backed by [`@noble/post-quantum`](https://github.com/paulmillr/noble-post-quantum)
and ships as a regular `dependency`. It has no native build step, runs on every
Node.js `>= 22` target, and is always available after `npm install @qnsp/cryptography`.

```ts
import { initializeExternalPqcProvider } from "@qnsp/cryptography/providers";

const noble = await initializeExternalPqcProvider("noble");
const { keyPair } = await noble.generateKeyPair({ algorithm: "ml-kem-768" });
```

### `liboqs` provider (optional, native, opt-in)

For workloads that require the full 90-algorithm NIST PQC surface (HQC, FN-DSA,
every SLH-DSA variant), the `liboqs` provider bridges to a native binding of the
[Open Quantum Safe liboqs](https://openquantumsafe.org/) library via the private
package `@cuilabs/liboqs-native`. This native binding is published **only to
GitHub Packages** (not the public npm registry) and is declared as an
`optionalDependency` of `@qnsp/cryptography`: public installs that do not have a
`@cuilabs` scope mapping will silently skip it and the rest of the package
continues to work through the `noble` provider.

To opt in, configure a scope mapping for the `@cuilabs` org and install the
native binding explicitly:

```bash
echo '@cuilabs:registry=https://npm.pkg.github.com' >> .npmrc
npm install @cuilabs/liboqs-native
```

Then bootstrap the provider:

```ts
import { initializeExternalPqcProvider } from "@qnsp/cryptography/providers";

const liboqs = await initializeExternalPqcProvider("liboqs", {
  algorithms: ["ml-kem-768", "ml-dsa-65"], // optional: restrict to a subset
});
```

If you request the `liboqs` provider without installing the native binding, the
package throws a targeted `Error` with the exact install command above and a
pointer to fall back to `initializeExternalPqcProvider("noble")`. No raw
`ERR_MODULE_NOT_FOUND` stack leaks to the caller.

### Determinism note

Neither provider supports seeded key generation for ML-KEM / ML-DSA / SLH-DSA
because the underlying NIST specifications do not expose deterministic key
generation primitives. Use `generateKeyPair` for production; use your own
test fixtures for deterministic test scenarios.

## Scripts

```bash
pnpm build     # Compile TypeScript to dist/
pnpm lint      # Run Biome checks
pnpm test      # Execute Vitest test suites
pnpm typecheck # Run TypeScript without emitting output
```

© 2025 QNSP - CUI LABS, Singapore
