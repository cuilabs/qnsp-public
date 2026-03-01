import { describe, expect, it } from "vitest";

import { createSseToken, deriveDocumentSseTokens, deriveQuerySseTokens } from "./sse.js";

const key = Buffer.from("sse-shared-secret").toString("base64");

describe("SSE helpers", () => {
	it("creates deterministic SSE tokens", () => {
		const tokenA = createSseToken(key, "tenant:tenant-1");
		const tokenB = createSseToken(key, "tenant:tenant-1");
		const tokenC = createSseToken(key, "tenant:tenant-2");

		expect(tokenA).toBe(tokenB);
		expect(tokenC).not.toBe(tokenA);
	});

	it("derives tokens from document metadata and content", () => {
		const tokens = deriveDocumentSseTokens(
			{
				tenantId: "tenant-1",
				documentId: "doc-9",
				sourceService: "storage-service",
				tags: ["pqc", "storage"],
				title: "Quantum storage",
				description: "Encrypted storage reference",
				body: "Quantum-safe storage pipeline",
				metadata: {
					mimeType: "application/pdf",
					owner: { id: "user-1" },
				},
			},
			key,
			{ includeContent: true, includeBody: true, maxContentTokens: 8 },
		);

		expect(tokens.length).toBeGreaterThanOrEqual(5);
		const set = new Set(tokens);
		expect(set.size).toBe(tokens.length);
	});

	it("derives query tokens for encrypted search", () => {
		const queryTokens = deriveQuerySseTokens("Quantum storage roadmap", key, {
			maxTokens: 4,
		});
		expect(queryTokens.length).toBeGreaterThan(0);
		const dedup = new Set(queryTokens);
		expect(dedup.size).toBe(queryTokens.length);
	});
});
