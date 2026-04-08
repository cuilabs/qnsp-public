import { createHash } from "node:crypto";

import { canonicalJson } from "./canonical-json.js";

export function sha3_512_hex(input: string | Uint8Array): string {
	return createHash("sha3-512")
		.update(typeof input === "string" ? Buffer.from(input, "utf8") : Buffer.from(input))
		.digest("hex");
}

export function computeCanonicalJsonSha3_512(value: unknown): string {
	return sha3_512_hex(canonicalJson(value));
}

export function computeReceiptHash(input: {
	receiptId: string;
	tenantId: string | null;
	subjectId: string;
	eventType: string;
	timestamp: string;
	payloadDigest: string;
	policyDecisionDigest: string | null;
	prevReceiptHash: string | null;
}): string {
	const body = {
		receiptId: input.receiptId,
		tenantId: input.tenantId,
		subjectId: input.subjectId,
		eventType: input.eventType,
		timestamp: input.timestamp,
		payloadDigest: input.payloadDigest,
		policyDecisionDigest: input.policyDecisionDigest,
		prevReceiptHash: input.prevReceiptHash,
	};
	return computeCanonicalJsonSha3_512(body);
}
