---
title: Java SDK
version: 0.0.0
last_updated: 2026-04-30
copyright: © 2025-2026 CUI Labs. All rights reserved.
---
# Java SDK

A Java SDK is **not yet planned**. CUI Labs ships first-party SDKs for TypeScript, Python, Go, and Rust today; Java is not on the v1.x roadmap.

## What to use instead

Java applications can integrate with QNSP through any of these paths — every QNSP service is a regulated REST API behind the same edge gateway, so any HTTP client works.

### Direct REST calls via the edge gateway

All QNSP services are reachable at `https://api.qnsp.cuilabs.io/proxy/<service>/...`. Authenticate with your QNSP API key as a Bearer token. The first call your application makes should be `POST /billing/v1/sdk/activate` to validate the key and resolve your tenant tier — see [SDK Activation](../sdk-activation.md) for the exact handshake the first-party SDKs perform.

```java
HttpClient http = HttpClient.newHttpClient();
HttpRequest activate = HttpRequest.newBuilder()
    .uri(URI.create("https://api.qnsp.cuilabs.io/billing/v1/sdk/activate"))
    .header("authorization", "Bearer " + System.getenv("QNSP_API_KEY"))
    .header("content-type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(
        "{\"sdkId\":\"custom-java\",\"sdkVersion\":\"0.1.0\",\"runtime\":\"java\"}"))
    .build();
```

### CLI invocation from a Java service

The [`@qnsp/cli`](https://github.com/cuilabs/qnsp-public/tree/main/packages/cli) tool can be invoked from a Java process via `Runtime.exec` for one-shot tasks. This is appropriate for batch / cron usage but not for high-throughput inline calls.

## When a Java SDK might happen

If a first-party Java SDK would change your decision to adopt QNSP, write to **engineering@cuilabs.io** and tell us the use case + estimated volume. We prioritise SDK languages by stated demand from regulated customers.

## Algorithm-name reference

If you implement your own thin Java wrapper for QNSP, mirror the algorithm-name surface used by the four shipped SDKs (TypeScript, Python, Go, Rust) so the byte-for-byte outputs round-trip across languages. The canonical names are:

- KEMs: `ML-KEM-512`, `ML-KEM-768`, `ML-KEM-1024`, `Kyber512..1024`, `HQC-128..256`, `BIKE-L1..L5`, `FrodoKEM-{640,976,1344}-{AES,SHAKE}`, `Classic-McEliece-*`, `sntrup761`
- Signatures: `ML-DSA-{44,65,87}`, `Dilithium{2,3,5}`, `Falcon-{512,1024}`, `SLH-DSA-{SHA2,SHAKE}-{128,192,256}{f,s}`, `MAYO-{1,2,3,5}`, `cross-rsdp{,g}-{128,192,256}-{balanced,fast,small}`

These match the names exposed by `liboqs` 0.12.0.
