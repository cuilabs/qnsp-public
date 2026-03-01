---
title: Auth SDK (@qnsp/auth-sdk)
version: 0.1.1
last_updated: 2026-02-16
copyright: © 2025 CUI Labs. All rights reserved.
license: Apache-2.0
source_files:
  - /packages/auth-sdk/src/index.ts
---

# Auth SDK (`@qnsp/auth-sdk`)

TypeScript client for `auth-service`. All tokens are signed with tenant-specific PQC algorithms based on crypto policy.

## Install

```bash
pnpm install @qnsp/auth-sdk
```

## Create a client

```ts
import { AuthClient } from "@qnsp/auth-sdk";

const auth = new AuthClient({
	baseUrl: "https://api.qnsp.cuilabs.io",
	apiKey: process.env.QNSP_API_KEY,
});
```

## Login

```ts
const tokenPair = await auth.login({
	email: "user@example.com",
	password: "<password>",
	tenantId: "<tenant_uuid>",
	totp: "123456", // Optional MFA code
});

console.log(tokenPair.accessToken);
console.log(tokenPair.refreshToken?.metadata);
```

## Refresh Token

```ts
const refreshed = await auth.refreshToken({
	refreshToken: tokenPair.refreshToken?.token ?? "",
});
```

## WebAuthn Passkeys

```ts
// Register a passkey
const regStart = await auth.registerPasskeyStart({
	userId: "<user_uuid>",
	tenantId: "<tenant_uuid>",
});

// Use WebAuthn API to create credential
const credential = await navigator.credentials.create({
	publicKey: regStart.options,
});

const regComplete = await auth.registerPasskeyComplete({
	userId: "<user_uuid>",
	tenantId: "<tenant_uuid>",
	challengeId: regStart.challengeId,
	response: credential,
});

// Authenticate with passkey
const authStart = await auth.authenticatePasskeyStart({
	email: "user@example.com",
	tenantId: "<tenant_uuid>",
});

const assertion = await navigator.credentials.get({
	publicKey: authStart.options,
});

const authComplete = await auth.authenticatePasskeyComplete({
	email: "user@example.com",
	tenantId: "<tenant_uuid>",
	challengeId: authStart.challengeId,
	response: assertion,
});

// List and manage passkeys
const passkeys = await auth.listPasskeys("<user_uuid>", "<tenant_uuid>");
await auth.deletePasskey("<credential_id>", "<user_uuid>");
```

## MFA

```ts
// Generate MFA challenge
const challenge = await auth.mfaChallenge({
	email: "user@example.com",
	tenantId: "<tenant_uuid>",
});

// Verify MFA code
const verified = await auth.mfaVerify({
	email: "user@example.com",
	tenantId: "<tenant_uuid>",
	totp: "123456",
});
```

## Federation

```ts
// SAML assertion
const samlResult = await auth.federateSAML({
	providerId: "okta",
	externalUserId: "ext-123",
	email: "user@example.com",
	name: "John Doe",
	tenantId: "<tenant_uuid>",
	roles: ["developer"],
});

// OIDC callback
const oidcResult = await auth.federateOIDC({
	providerId: "google",
	code: "<authorization_code>",
	state: "<state>",
});
```

## Service-to-Service Authentication

For internal services to authenticate with each other:

```ts
import { requestServiceToken, getServiceAuthHeader } from "@qnsp/auth-sdk";

// Get service token
const token = await requestServiceToken({
	authServiceUrl: "http://localhost:8081",
	serviceId: "storage-service",
	serviceSecret: "<service_secret>",
	audience: "internal-service",
});

// Or get ready-to-use header
const authHeader = await getServiceAuthHeader({
	authServiceUrl: "http://localhost:8081",
	serviceId: "storage-service",
	serviceSecret: "<service_secret>",
});

// Use in requests
fetch(url, {
	headers: { Authorization: authHeader },
});
```

## PQC Algorithm Information

The Auth SDK exports the full 90-algorithm NIST name mapping covering all PQC families supported by QNSP: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), FN-DSA (FIPS 206 draft), HQC, BIKE, Classic McEliece, FrodoKEM, NTRU, NTRU-Prime, MAYO, CROSS, UOV, and SNOVA.

```ts
import { toNistAlgorithmName, ALGORITHM_TO_NIST } from "@qnsp/auth-sdk";

// Convert internal to NIST name
const nistName = toNistAlgorithmName("dilithium-3"); // "ML-DSA-65"

// Full mapping covers all 90 PQC algorithms. Representative entries:
console.log(ALGORITHM_TO_NIST);
// {
//   "kyber-512": "ML-KEM-512",        // FIPS 203
//   "kyber-768": "ML-KEM-768",
//   "kyber-1024": "ML-KEM-1024",
//   "dilithium-2": "ML-DSA-44",       // FIPS 204
//   "dilithium-3": "ML-DSA-65",
//   "dilithium-5": "ML-DSA-87",
//   "sphincs-sha2-128f-simple": "SLH-DSA-SHA2-128f",  // FIPS 205
//   "sphincs-shake-256f-simple": "SLH-DSA-SHAKE-256f",
//   "falcon-512": "FN-DSA-512",       // FIPS 206 (draft)
//   "falcon-1024": "FN-DSA-1024",
//   "hqc-128": "HQC-128",             // NIST selected (March 2025)
//   "bike-l1": "BIKE-L1",             // NIST Round 4
//   "mceliece-348864": "Classic-McEliece-348864",  // ISO standard
//   "frodokem-640-aes": "FrodoKEM-640-AES",        // ISO standard
//   "ntru-hps-2048-509": "NTRU-HPS-2048-509",      // liboqs 0.15
//   "sntrup761": "sntrup761",          // NTRU-Prime
//   "mayo-1": "MAYO-1",               // NIST Additional Signatures
//   "cross-rsdp-128-balanced": "CROSS-RSDP-128-balanced",
//   "ov-Is": "UOV-Is",
//   "snova-24-5-4": "SNOVA-24-5-4",
//   ... // 90 algorithms total
// }
```

## Key APIs

### Authentication
- `AuthClient.login(request)`
- `AuthClient.refreshToken(request)`

### WebAuthn
- `AuthClient.registerPasskeyStart(request)`
- `AuthClient.registerPasskeyComplete(request)`
- `AuthClient.authenticatePasskeyStart(request)`
- `AuthClient.authenticatePasskeyComplete(request)`
- `AuthClient.listPasskeys(userId, tenantId)`
- `AuthClient.deletePasskey(credentialId, userId)`

### MFA
- `AuthClient.mfaChallenge(request)`
- `AuthClient.mfaVerify(request)`

### Federation
- `AuthClient.federateSAML(request)`
- `AuthClient.federateOIDC(request)`

### Service Tokens
- `requestServiceToken(config)` - Get service-to-service token
- `getServiceAuthHeader(config)` - Get ready-to-use auth header

### Utilities
- `toNistAlgorithmName(algorithm)` - Convert internal to NIST name
- `ALGORITHM_TO_NIST` - Algorithm name mapping
