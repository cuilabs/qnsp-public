---
title: JVM / Android SDK
version: 0.1.0
last_updated: 2026-06-01
copyright: © 2025-2026 CUI Labs. All rights reserved.
license: Apache-2.0
---
# JVM / Android SDK

QNSP ships a first-party **JVM / Android SDK** — `io.cuilabs:qnsp` on Maven
Central. One artifact serves both **server-side JVM** (Spring Boot, plain
Java/Kotlin) and **native Android** (API 21+), because its only transport
dependency, OkHttp, runs on both. It mirrors the wire contract of the
TypeScript, Python, Go, and Rust SDKs byte-for-byte (same 11-service surface,
same algorithm names, same FIPS 203 / 204 / 205 posture).

## Install

Gradle (Kotlin DSL):

```kotlin
dependencies {
    implementation("io.cuilabs:qnsp:0.1.0")
}
```

Maven:

```xml
<dependency>
  <groupId>io.cuilabs</groupId>
  <artifactId>qnsp</artifactId>
  <version>0.1.0</version>
</dependency>
```

Get a free API key at <https://cloud.qnsp.cuilabs.io/auth>. The client performs
the `POST /billing/v1/sdk/activate` handshake automatically on first use (see
[SDK Activation](../sdk-activation.md)).

## Quick start

Kotlin:

```kotlin
val qnsp = QnspClient(System.getenv("QNSP_API_KEY"))
qnsp.ensureActivated()                       // surfaces an invalid key eagerly
val key = qnsp.kms.createKey(CreateKeyRequest(algorithm = "ml-dsa-65", purpose = "signing"))
qnsp.vault.createSecret(CreateSecretRequest(name = "api-key", payloadB64 = payloadB64))
```

Java:

```java
QnspClient qnsp = new QnspClient(System.getenv("QNSP_API_KEY"));
qnsp.ensureActivated();
JsonObject key = qnsp.getKms().createKey(new CreateKeyRequest("ml-dsa-65", "signing"));
```

The eleven service sub-clients are reached as `qnsp.<service>` (Kotlin) /
`qnsp.get<Service>()` (Java): `kms`, `vault`, `audit`, `auth`, `tenant`,
`access`, `billing`, `cryptoInventory`, `storage`, `search`, `ai`. Service
methods return `kotlinx.serialization.json.JsonObject`; KMS `sign`/`wrap`/`unwrap`
return `ByteArray`, `verify` returns `Boolean`. Webhook verification is in
`QnspWebhooks`.

## On-device PQC primitives

The SDK is a managed control-plane client — server-side KMS performs PQC key
operations. For **on-device** PQC inside an Android app (local ML-KEM / ML-DSA),
pair the SDK with a JVM PQC library such as Bouncy Castle, or the OS-native PQC
APIs (Android Keystore PQC, available from Android 17). The byte-for-byte
algorithm-name surface matches the other SDKs:

- KEMs: `ML-KEM-512`, `ML-KEM-768`, `ML-KEM-1024`, `Kyber512..1024`, `HQC-128..256`, `BIKE-L1..L5`, `FrodoKEM-{640,976,1344}-{AES,SHAKE}`, `Classic-McEliece-*`, `sntrup761`
- Signatures: `ML-DSA-{44,65,87}`, `Dilithium{2,3,5}`, `Falcon-{512,1024}`, `SLH-DSA-{SHA2,SHAKE}-{128,192,256}{f,s}`, `MAYO-{1,2,3,5}`, `cross-rsdp{,g}-{128,192,256}-{balanced,fast,small}`

## Source & support

Source: [`sdks/jvm/`](https://github.com/cuilabs/qnsp-public/tree/main/sdks/jvm).
Questions or feature requests: **engineering@cuilabs.io**.
