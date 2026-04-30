/**
 * QNSP Vault — PQC-encrypted secret storage with versioning, rotation,
 * and deletion. Wraps `apps/vault-service` (`/vault/v1`).
 */

import type { Internal, RequestOptions } from "./_internal.js";

const PATH_PREFIX = "/vault/v1";

export interface CreateSecretRequest {
	readonly name: string;
	readonly payloadB64: string;
	readonly algorithm?: string;
	readonly metadata?: Record<string, unknown>;
}

export class VaultClient {
	constructor(private readonly internal: Internal) {}

	createSecret(req: CreateSecretRequest, opts?: Pick<RequestOptions, "idempotencyKey">) {
		return this.internal.request("POST", `${PATH_PREFIX}/secrets`, req, opts);
	}

	getSecret(secretId: string) {
		return this.internal.request("GET", `${PATH_PREFIX}/secrets/${secretId}`);
	}

	getSecretVersion(secretId: string, version: number) {
		return this.internal.request("GET", `${PATH_PREFIX}/secrets/${secretId}/versions/${version}`);
	}

	rotateSecret(
		secretId: string,
		payloadB64: string,
		algorithm?: string,
		opts?: Pick<RequestOptions, "idempotencyKey">,
	) {
		const body: Record<string, unknown> = { payloadB64 };
		if (algorithm !== undefined) body["algorithm"] = algorithm;
		return this.internal.request("POST", `${PATH_PREFIX}/secrets/${secretId}/rotate`, body, opts);
	}

	deleteSecret(secretId: string): Promise<Record<string, unknown>> {
		return this.internal.request("DELETE", `${PATH_PREFIX}/secrets/${secretId}`);
	}

	listSecretVersions(secretId: string) {
		return this.internal.request("GET", `${PATH_PREFIX}/secrets/${secretId}/versions`);
	}
}
