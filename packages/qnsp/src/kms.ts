/**
 * QNSP KMS — server-side PQC keys with sign, verify, wrap, and unwrap.
 * Wraps `apps/kms-service` (`/kms/v1`).
 */

import type { Internal, RequestOptions } from "./_internal.js";
import { QnspApiError } from "./errors.js";

const PATH_PREFIX = "/kms/v1";

export interface CreateKeyRequest {
	readonly algorithm: string;
	readonly purpose: string; // "signing" | "encryption" | "kem"
	readonly metadata?: Record<string, unknown>;
}

interface SignResponse {
	readonly signatureB64?: string;
}

interface VerifyResponse {
	readonly valid?: boolean;
}

interface WrapResponse {
	readonly ciphertextB64?: string;
}

interface UnwrapResponse {
	readonly plaintextB64?: string;
}

export class KmsClient {
	constructor(private readonly internal: Internal) {}

	createKey(req: CreateKeyRequest, opts?: Pick<RequestOptions, "idempotencyKey">) {
		return this.internal.request("POST", `${PATH_PREFIX}/keys`, req, opts);
	}

	listKeys(query?: RequestOptions["query"]) {
		return this.internal.request("GET", `${PATH_PREFIX}/keys`, undefined, { query });
	}

	getKey(keyId: string) {
		return this.internal.request("GET", `${PATH_PREFIX}/keys/${keyId}`);
	}

	rotateKey(keyId: string, opts?: Pick<RequestOptions, "idempotencyKey">) {
		return this.internal.request("POST", `${PATH_PREFIX}/keys/${keyId}/rotate`, undefined, opts);
	}

	deleteKey(keyId: string): Promise<Record<string, unknown>> {
		return this.internal.request("DELETE", `${PATH_PREFIX}/keys/${keyId}`);
	}

	async sign(
		keyId: string,
		data: Uint8Array,
		opts?: Pick<RequestOptions, "idempotencyKey">,
	): Promise<Uint8Array> {
		const body = { dataB64: encodeB64(data) };
		const resp = await this.internal.request<SignResponse>(
			"POST",
			`${PATH_PREFIX}/keys/${keyId}/sign`,
			body,
			opts,
		);
		if (!resp.signatureB64) {
			throw new QnspApiError("kms.sign: response missing signatureB64", 200);
		}
		return decodeB64(resp.signatureB64);
	}

	async verify(keyId: string, data: Uint8Array, signature: Uint8Array): Promise<boolean> {
		const body = { dataB64: encodeB64(data), signatureB64: encodeB64(signature) };
		const resp = await this.internal.request<VerifyResponse>(
			"POST",
			`${PATH_PREFIX}/keys/${keyId}/verify`,
			body,
		);
		return resp.valid === true;
	}

	async wrap(
		keyId: string,
		plaintext: Uint8Array,
		opts?: Pick<RequestOptions, "idempotencyKey">,
	): Promise<Uint8Array> {
		const body = { plaintextB64: encodeB64(plaintext) };
		const resp = await this.internal.request<WrapResponse>(
			"POST",
			`${PATH_PREFIX}/keys/${keyId}/wrap`,
			body,
			opts,
		);
		if (!resp.ciphertextB64) {
			throw new QnspApiError("kms.wrap: response missing ciphertextB64", 200);
		}
		return decodeB64(resp.ciphertextB64);
	}

	async unwrap(
		keyId: string,
		ciphertext: Uint8Array,
		opts?: Pick<RequestOptions, "idempotencyKey">,
	): Promise<Uint8Array> {
		const body = { ciphertextB64: encodeB64(ciphertext) };
		const resp = await this.internal.request<UnwrapResponse>(
			"POST",
			`${PATH_PREFIX}/keys/${keyId}/unwrap`,
			body,
			opts,
		);
		if (!resp.plaintextB64) {
			throw new QnspApiError("kms.unwrap: response missing plaintextB64", 200);
		}
		return decodeB64(resp.plaintextB64);
	}
}

function encodeB64(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString("base64");
}

function decodeB64(b64: string): Uint8Array {
	return new Uint8Array(Buffer.from(b64, "base64"));
}
