/**
 * QNSP webhook signature verification + typed event parsing.
 *
 * Every QNSP webhook is signed with HMAC-SHA-256 over the raw request
 * body. Always verify the **raw bytes** before parsing JSON.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { QnspWebhookError } from "./errors.js";

/** Default replay-protection window — 5 minutes. */
export const MAX_WEBHOOK_SKEW_MS = 5 * 60 * 1000;

export interface QnspWebhookEvent {
	readonly eventType: string;
	readonly eventId: string;
	readonly occurredAt: string;
	readonly payload: Record<string, unknown>;
}

/**
 * Constant-time HMAC-SHA-256 verification. The header must be of the
 * form `sha256=<hex>`.
 */
export function verifyQnspWebhookSignature(
	body: Uint8Array | string,
	signatureHeader: string,
	secret: string,
): void {
	if (!signatureHeader.startsWith("sha256=")) {
		throw new QnspWebhookError("signature header must start with 'sha256='");
	}
	const expectedHex = signatureHeader.slice("sha256=".length);
	const expected = Buffer.from(expectedHex, "hex");
	if (expected.length === 0) {
		throw new QnspWebhookError("signature is not valid hex");
	}
	const bodyBytes = typeof body === "string" ? Buffer.from(body, "utf8") : Buffer.from(body);
	const actual = createHmac("sha256", secret).update(bodyBytes).digest();
	if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
		throw new QnspWebhookError("signature mismatch");
	}
}

/**
 * Verify the HMAC, enforce replay protection, parse the JSON body, and
 * return a typed `QnspWebhookEvent`.
 */
export function parseQnspWebhook(input: {
	readonly body: Uint8Array | string;
	readonly signatureHeader: string;
	readonly timestampHeader?: string;
	readonly secret: string;
	readonly maxSkewMs?: number;
	readonly now?: Date;
}): QnspWebhookEvent {
	verifyQnspWebhookSignature(input.body, input.signatureHeader, input.secret);

	const skewMs = input.maxSkewMs ?? MAX_WEBHOOK_SKEW_MS;
	if (input.timestampHeader !== undefined && input.timestampHeader.length > 0) {
		const ts = Date.parse(input.timestampHeader);
		if (Number.isNaN(ts)) {
			throw new QnspWebhookError("timestamp header is not RFC3339");
		}
		const reference = input.now ? input.now.getTime() : Date.now();
		const delta = reference - ts;
		if (delta > skewMs) throw new QnspWebhookError("timestamp is too old");
		if (-delta > skewMs) throw new QnspWebhookError("timestamp is in the future");
	}

	const text =
		typeof input.body === "string" ? input.body : Buffer.from(input.body).toString("utf8");
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		throw new QnspWebhookError("body is not valid JSON");
	}
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		throw new QnspWebhookError("body is not a JSON object");
	}
	const obj = raw as Record<string, unknown>;
	const eventType = obj["event_type"];
	const eventId = obj["event_id"];
	if (typeof eventType !== "string") {
		throw new QnspWebhookError("missing event_type");
	}
	if (typeof eventId !== "string") {
		throw new QnspWebhookError("missing event_id");
	}
	const occurredAtRaw = obj["occurred_at"];
	const occurredAt = typeof occurredAtRaw === "string" ? occurredAtRaw : "";
	const payloadRaw = obj["payload"];
	const payload =
		payloadRaw && typeof payloadRaw === "object" && !Array.isArray(payloadRaw)
			? (payloadRaw as Record<string, unknown>)
			: {};
	return { eventType, eventId, occurredAt, payload };
}
