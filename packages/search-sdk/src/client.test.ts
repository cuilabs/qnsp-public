import type { fetch as undiciFetch } from "undici";
import { describe, expect, it, vi } from "vitest";

type FetchImpl = typeof undiciFetch;

import { SearchClient } from "./client.js";
import type { IndexDocumentRequest } from "./types.js";

const baseDocument: IndexDocumentRequest = {
	tenantId: "tenant-1",
	documentId: "doc-1",
	version: "v1",
	sourceService: "storage-service",
	security: {
		controlPlaneTokenSha256: "a".repeat(64),
		pqcSignatures: [],
		hardwareProvider: null,
		attestationStatus: null,
		attestationProof: null,
	},
	signature: {
		provider: "deterministic-pqc",
		algorithm: "dilithium-3",
		value: "signature",
		publicKey: "public",
	},
};

describe("SearchClient", () => {
	it("submits index requests with bearer token", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 202,
			statusText: "Accepted",
		});

		const client = new SearchClient({
			baseUrl: "https://search.internal",
			apiToken: "search-token",
			fetchImpl: mockFetch as unknown as FetchImpl,
		});

		await client.indexDocument({
			...baseDocument,
			title: "Quantum Secure Roadmap",
		});

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const firstCall = mockFetch.mock.calls.at(0);
		if (!firstCall) {
			throw new Error("fetch was not invoked");
		}
		const [url, init] = firstCall;
		expect(url).toBe("https://search.internal/search/v1/documents/index");
		expect(init?.method).toBe("POST");
		expect(init?.headers).toMatchObject({
			Authorization: "Bearer search-token",
		});
	});

	it("executes search queries with SSE filters", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			statusText: "OK",
			json: async () => ({
				items: [],
				nextCursor: null,
			}),
		});

		const client = new SearchClient({
			baseUrl: "https://search.internal",
			apiToken: "search-token",
			fetchImpl: mockFetch as unknown as FetchImpl,
		});

		await client.search({
			tenantId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
			query: "quantum",
			sseTokens: ["token-1", "token-2"],
		});

		const firstCall = mockFetch.mock.calls.at(0);
		if (!firstCall) {
			throw new Error("fetch was not invoked");
		}
		const [url] = firstCall;
		expect(url).toContain("sse=token-1");
		expect(url).toContain("sse=token-2");
	});

	it("supports SSE-only queries", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			statusText: "OK",
			json: async () => ({
				items: [],
				nextCursor: null,
			}),
		});

		const client = new SearchClient({
			baseUrl: "https://search.internal",
			apiToken: "search-token",
			fetchImpl: mockFetch as unknown as FetchImpl,
		});

		await client.search({
			tenantId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
			sseTokens: ["token-only"],
		});

		const firstCall = mockFetch.mock.calls.at(0);
		if (!firstCall) {
			throw new Error("fetch was not invoked");
		}
		const [url] = firstCall;
		expect(url).toContain("sse=token-only");
		expect(url).not.toContain("q=");
	});

	it("derives SSE tokens when configured with a key", () => {
		const key = Buffer.from("shared-secret").toString("base64");
		const client = new SearchClient({
			baseUrl: "https://search.internal",
			apiToken: "test-api-token",
			sseKey: key,
		});

		const token = client.createSseToken("tenant:tenant-1");
		expect(typeof token).toBe("string");
		expect(token.length).toBeGreaterThan(10);

		const derived = client.deriveDocumentSseTokens({
			tenantId: "tenant-1",
			documentId: "doc-99",
			sourceService: "storage-service",
			tags: ["pqc"],
			metadata: { region: "us-east-1" },
			title: "Quantum Storage",
			description: "Encrypted storage reference",
			body: "Quantum-safe storage pipeline",
		});
		expect(derived.length).toBeGreaterThan(1);

		const queryTokens = client.deriveQuerySseTokens("quantum storage");
		expect(queryTokens.length).toBeGreaterThan(0);
	});
});
