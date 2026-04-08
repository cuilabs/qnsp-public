# @qnsp/browser-sdk

Browser-compatible PQC encryption SDK for QNSP. Client-side encryption, signing, and key encapsulation using NIST FIPS 203/204/205 standards via @noble/post-quantum.

Part of the [Quantum-Native Security Platform (QNSP)](https://qnsp.cuilabs.io).

## Installation

```bash
pnpm add @qnsp/browser-sdk
```

## Quick Start

```typescript
import { initializePqcProvider, encryptBeforeUpload, generateEncryptionKeyPair } from "@qnsp/browser-sdk";

await initializePqcProvider({ apiKey: "YOUR_API_KEY" });

const { publicKey, privateKey } = await generateEncryptionKeyPair("kyber-768");
const envelope = await encryptBeforeUpload(plaintext, publicKey, "kyber-768");
```

## Documentation

- [SDK Reference](https://docs.qnsp.cuilabs.io/sdk/browser-sdk)
- [API Documentation](https://docs.qnsp.cuilabs.io/api)
- [Getting Started](https://docs.qnsp.cuilabs.io/quickstart)

## Requirements

- A modern browser with WebCrypto support
- Node.js >= 24.12.0 when bundling or running in Node (`engines` in `package.json`)
- A QNSP account and API key — [sign up free](https://cloud.qnsp.cuilabs.io/auth) with GitHub, Google, or email

## License

[Apache-2.0](./LICENSE)
