/**
 * QNSP Storage — PQC-encrypted object storage with SSE-X. Wraps
 * `apps/storage-service` (`/storage/storage/v1`).
 */

import type { Internal, RequestOptions } from "./_internal.js";
import { QnspApiError } from "./errors.js";

const PATH_PREFIX = "/storage/storage/v1";

export interface PutObjectInput {
	readonly data: Uint8Array;
	readonly contentType?: string;
	readonly sseAlgorithm?: string;
	readonly metadata?: Record<string, unknown>;
}

interface GetObjectResponse {
	readonly dataB64?: string;
	readonly [key: string]: unknown;
}

export class StorageClient {
	constructor(private readonly internal: Internal) {}

	putObject(
		bucket: string,
		key: string,
		input: PutObjectInput,
		opts?: Pick<RequestOptions, "idempotencyKey">,
	) {
		const body: Record<string, unknown> = {
			dataB64: encodeB64(input.data),
		};
		if (input.contentType !== undefined) body["contentType"] = input.contentType;
		if (input.sseAlgorithm !== undefined) body["sseAlgorithm"] = input.sseAlgorithm;
		if (input.metadata !== undefined) body["metadata"] = input.metadata;
		return this.internal.request(
			"PUT",
			`${PATH_PREFIX}/buckets/${bucket}/objects/${key}`,
			body,
			opts,
		);
	}

	/**
	 * Returns `[plaintext bytes, descriptor JSON]`. Throws `QnspApiError`
	 * if the descriptor is missing the dataB64 field.
	 */
	async getObject(bucket: string, key: string): Promise<readonly [Uint8Array, GetObjectResponse]> {
		const resp = await this.internal.request<GetObjectResponse>(
			"GET",
			`${PATH_PREFIX}/buckets/${bucket}/objects/${key}`,
		);
		if (!resp.dataB64) {
			throw new QnspApiError("storage.getObject: response missing dataB64", 200);
		}
		return [decodeB64(resp.dataB64), resp];
	}

	async deleteObject(bucket: string, key: string): Promise<void> {
		await this.internal.request("DELETE", `${PATH_PREFIX}/buckets/${bucket}/objects/${key}`);
	}

	listObjects(bucket: string, query?: RequestOptions["query"]) {
		return this.internal.request("GET", `${PATH_PREFIX}/buckets/${bucket}/objects`, undefined, {
			query,
		});
	}

	listBuckets() {
		return this.internal.request("GET", `${PATH_PREFIX}/buckets`);
	}
}

function encodeB64(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString("base64");
}

function decodeB64(b64: string): Uint8Array {
	return new Uint8Array(Buffer.from(b64, "base64"));
}
