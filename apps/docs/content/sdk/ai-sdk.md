---
title: AI SDK (@qnsp/ai-sdk)
version: 0.1.0
last_updated: 2026-01-04
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/ai-sdk/src/client.ts
  - /packages/ai-sdk/src/types.ts
---

# AI SDK (`@qnsp/ai-sdk`)

TypeScript client for `ai-orchestrator`. Model artifacts and inference data are encrypted with tenant-specific PQC algorithms based on crypto policy.

## Install

```bash
pnpm install @qnsp/ai-sdk
```

## Create a client

```ts
import { AiOrchestratorClient } from "@qnsp/ai-sdk";

const ai = new AiOrchestratorClient({
	baseUrl: "http://localhost:8094",
	token: "<access_token>",
	tier: "enterprise-pro", // Optional tier check
});
```

## Register Artifacts

```ts
const artifact = await ai.registerArtifact({
	tenantId: "<tenant_uuid>",
	name: "llama-7b-fine-tuned",
	type: "model",
	sizeBytes: 14000000000,
	checksumSha3: "<sha3_hash>",
	metadata: {
		framework: "pytorch",
		version: "2.0",
	},
});
```

## Submit Workloads

```ts
const workload = await ai.submitWorkload({
	tenantId: "<tenant_uuid>",
	name: "inference-job",
	priority: "high",
	schedulingPolicy: "on-demand",
	containerImage: "qnsp/inference-runtime:latest",
	command: ["python", "-m", "inference"],
	env: {
		MODEL_PATH: "/models/llama-7b",
	},
	resources: {
		cpu: 4,
		memoryMb: 16384,
		gpu: 1,
	},
	artifacts: [
		{
			artifactId: "<artifact_uuid>",
			mountPath: "/models",
			accessMode: "read",
		},
	],
	idempotencyKey: "<unique_key>", // Optional
});
```

## Deploy Models

```ts
const deployment = await ai.deployModel({
	tenantId: "<tenant_uuid>",
	modelName: "llama-7b-fine-tuned",
	artifactId: "<artifact_uuid>",
	runtimeImage: "qnsp/inference-runtime:latest",
	manifest: {
		version: "1.0.0",
		framework: "pytorch",
		inputSchema: { /* ... */ },
		outputSchema: { /* ... */ },
	},
	resources: {
		cpu: 4,
		memoryMb: 16384,
		gpu: 1,
	},
	priority: "normal",
	schedulingPolicy: "on-demand",
});
```

## Invoke Inference

```ts
const result = await ai.invokeInference({
	tenantId: "<tenant_uuid>",
	modelDeploymentId: "<deployment_uuid>",
	input: {
		prompt: "Explain quantum computing",
		maxTokens: 500,
	},
	priority: "normal",
});

console.log(result.output);
```

## Stream Inference Events

```ts
for await (const event of ai.streamInferenceEvents("<workload_uuid>")) {
	switch (event.type) {
		case "token":
			process.stdout.write(event.token);
			break;
		case "complete":
			console.log("\nDone:", event.usage);
			break;
		case "error":
			console.error("Error:", event.message);
			break;
	}
}
```

## Manage Workloads

```ts
// Get workload status
const workload = await ai.getWorkload("<workload_uuid>");
console.log(workload.status); // "pending" | "running" | "completed" | "failed"

// List workloads
const { items, nextCursor } = await ai.listWorkloads({
	tenantId: "<tenant_uuid>",
	status: "running",
	limit: 20,
});

// Cancel workload
await ai.cancelWorkload({
	workloadId: "<workload_uuid>",
	reason: "No longer needed",
});
```

## Tier Access

The SDK validates tier access for premium features:

```ts
import { AiOrchestratorClient, TierError } from "@qnsp/ai-sdk";

try {
	const ai = new AiOrchestratorClient({
		baseUrl: "http://localhost:8094",
		token: "<token>",
		tier: "dev-starter",
	});
	
	// Training requires enterprise-pro tier
	await ai.submitWorkload({
		name: "fine-tuning-job",
		// ...
	});
} catch (error) {
	if (error instanceof TierError) {
		console.log("Training requires enterprise-pro tier");
	}
}
```

## Key APIs

### Artifacts
- `AiOrchestratorClient.registerArtifact(input)` - Register model artifact

### Workloads
- `AiOrchestratorClient.submitWorkload(input)` - Submit workload
- `AiOrchestratorClient.deployModel(request)` - Deploy model
- `AiOrchestratorClient.getWorkload(workloadId)` - Get status
- `AiOrchestratorClient.listWorkloads(params?)` - List workloads
- `AiOrchestratorClient.cancelWorkload(input)` - Cancel workload

### Inference
- `AiOrchestratorClient.invokeInference(request)` - Invoke inference
- `AiOrchestratorClient.streamInferenceEvents(workloadId)` - Stream events

### Types
- `SubmitWorkloadRequest` - Workload configuration
- `ModelDeploymentRequest` - Model deployment config
- `InferenceRequest` - Inference input
- `InferenceStreamEvent` - Streaming event
- `TierError` - Tier access error
