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

### liboqs provider

The package ships with an adapter for [`@open-quantum-safe/liboqs`](https://github.com/open-quantum-safe/liboqs). Importing `@qnsp/cryptography/providers/liboqs` automatically registers the factory under the name `liboqs`. When the optional dependency is installed, you can bootstrap it as follows:

```ts
import { initializeExternalPqcProvider } from "@qnsp/cryptography/providers";

const liboqs = await initializeExternalPqcProvider("liboqs", {
  // Optional: restrict to specific algorithms
  algorithms: ["kyber-768", "dilithium-3"],
  configuration: {
    moduleId: "@open-quantum-safe/liboqs" // defaults to this value
  }
});
```

The adapter dynamically loads the module, discovers the enabled Kyber and Dilithium variants, and exposes a fully functional `PqcProvider`. Seeded key generation is not supported because liboqs does not expose deterministic primitives for these algorithms.

## Scripts

```bash
pnpm build     # Compile TypeScript to dist/
pnpm lint      # Run Biome checks
pnpm test      # Execute Vitest test suites
pnpm typecheck # Run TypeScript without emitting output
```

© 2025 QNSP - CUI LABS, Singapore
