# @qnsp/ai-sdk

TypeScript client for the QNSP AI Orchestrator. Provides workload submission, model deployment,
inference, training, and artifact management helpers with built-in tier enforcement.

## Installation

```bash
pnpm add @qnsp/ai-sdk
```

## Authentication

The client authenticates with a **QNSP service token** (PQC-signed JWT) issued by the auth service.
Pass the token via the `token` option. You may optionally set `tier` if you are enforcing pricing
entitlements on the client before making API calls.

```ts
import { AiOrchestratorClient } from "@qnsp/ai-sdk";

const ai = new AiOrchestratorClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/ai",
  token: process.env.QNSP_SERVICE_TOKEN!,
  tier: "dev-pro",
});
```

## Tier requirements

| Capability | Minimum tier | Notes |
|------------|--------------|-------|
| Basic inference (`invokeInference`, `deployModel`) | `dev-pro` | Throws `TierError` if `tier` is lower |
| Secure enclaves / GPU workloads | `enterprise-standard` | Triggered when workloads request GPU resources |
| AI training / fine-tuning | `enterprise-pro` | Automatically enforced when workload name contains `training` or `fine-tune` |

The SDK relies on `@qnsp/shared-kernel`'s `checkTierAccess` helper, so upgrading the tier in the
constructor immediately unlocks the relevant calls.

## Usage example

```ts
import { AiOrchestratorClient } from "@qnsp/ai-sdk";

const ai = new AiOrchestratorClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/ai",
  token: process.env.QNSP_SERVICE_TOKEN!,
  tier: "enterprise-pro",
});

// Register an artifact
const artifact = await ai.registerArtifact({
  tenantId: "tenant_123",
  modelName: "quantum-guardian",
  digest: "sha3-512:...",
  storageUrl: "qnsp://storage/documents/abc",
});

// Submit an enclave-enabled training workload
await ai.submitWorkload({
  tenantId: "tenant_123",
  name: "guardian-training",
  resources: { cpu: 8, memory: "64Gi", gpu: 2 },
  containerImage: "ghcr.io/qnsp/training:latest",
  command: ["python", "train.py"],
  artifacts: [{ artifactId: artifact.artifactId, mountPath: "/models", accessMode: "read" }],
  env: { DATASET_PATH: "/datasets/latest" },
});
```

## Telemetry

All requests emit OpenTelemetry spans when you wrap `fetchImpl` with your tracing/export logic.
Future releases will expose `createAiClientTelemetry`, matching other SDKs.

## Related documentation

- [Developer onboarding guide](../../docs/guides/developer-onboarding.md#sdk-quick-links)
- [AI orchestrator service plan](../../docs/service-plans/storage-service-plan.md)
- [Pricing & tier limits](../../packages/shared-kernel/src/tier-limits.ts)

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE).

© 2025 QNSP - CUI LABS, Singapore
