import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QnspVectorStoreConfig } from "./vector-store.js";
import { QnspVectorStore } from "./vector-store.js";

// ─── Mock @qnsp/search-sdk ────────────────────────────────────────────────────

const mockIndexDocumentWithAutoSse = vi
	.fn<(input: Record<string, unknown>) => Promise<void>>()
	.mockResolvedValue(undefined);
const mockSearchWithAutoSse = vi.fn();

vi.mock("@qnsp/search-sdk", () => ({
	SearchClient: class MockSearchClient {
		indexDocumentWithAutoSse = mockIndexDocumentWithAutoSse;
		searchWithAutoSse = mockSearchWithAutoSse;
	},
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_CONFIG: QnspVectorStoreConfig = {
	apiKey: "qnsp_test_key",
	tenantId: "tenant-uuid-1234",
};

function makeStore(overrides?: Partial<QnspVectorStoreConfig>): QnspVectorStore {
	return new QnspVectorStore({ ...BASE_CONFIG, ...overrides });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("QnspVectorStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("add()", () => {
		it("returns empty array when given no nodes", async () => {
			const store = makeStore();
			const result = await store.add([]);
			expect(result).toEqual([]);
			expect(mockIndexDocumentWithAutoSse).not.toHaveBeenCalled();
		});

		it("indexes each node and returns their IDs", async () => {
			const store = makeStore();
			const nodes = [
				{ id_: "node-1", text: "PQC overview", metadata: { source: "doc-a" } },
				{ id_: "node-2", text: "ML-KEM details", metadata: {} },
			];

			const result = await store.add(nodes);

			expect(result).toEqual(["node-1", "node-2"]);
			expect(mockIndexDocumentWithAutoSse).toHaveBeenCalledTimes(2);

			const firstCall = mockIndexDocumentWithAutoSse.mock.calls[0]?.[0];
			expect(firstCall).toMatchObject({
				tenantId: "tenant-uuid-1234",
				documentId: "node-1",
				body: "PQC overview",
				metadata: { source: "doc-a" },
				sourceService: "llamaindex-qnsp",
			});
		});

		it("uses custom sourceService when configured", async () => {
			const store = makeStore({ sourceService: "my-agent" });
			await store.add([{ id_: "n1", text: "hello" }]);

			const call = mockIndexDocumentWithAutoSse.mock.calls[0]?.[0];
			expect(call?.["sourceService"]).toBe("my-agent");
		});

		it("uses empty metadata when node has no metadata", async () => {
			const store = makeStore();
			await store.add([{ id_: "n1", text: "text" }]);

			const call = mockIndexDocumentWithAutoSse.mock.calls[0]?.[0];
			expect(call?.["metadata"]).toEqual({});
		});

		it("propagates indexing errors", async () => {
			mockIndexDocumentWithAutoSse.mockRejectedValueOnce(new Error("Search API error: 503"));
			const store = makeStore();
			await expect(store.add([{ id_: "n1", text: "text" }])).rejects.toThrow(
				"Search API error: 503",
			);
		});
	});

	describe("query()", () => {
		it("returns empty result when queryStr is empty", async () => {
			const store = makeStore();
			const result = await store.query({ queryStr: "" });
			expect(result).toEqual({ nodes: [], similarities: [], ids: [] });
			expect(mockSearchWithAutoSse).not.toHaveBeenCalled();
		});

		it("returns empty result when queryStr is absent", async () => {
			const store = makeStore();
			const result = await store.query({});
			expect(result).toEqual({ nodes: [], similarities: [], ids: [] });
		});

		it("maps search hits to nodes with correct shape", async () => {
			mockSearchWithAutoSse.mockResolvedValueOnce({
				items: [
					{
						documentId: "doc-1",
						title: "PQC overview",
						description: null,
						metadata: { source: "manual" },
						score: 0.95,
						tags: [],
						version: "1",
						tenantId: "tenant-uuid-1234",
						updatedAt: "2026-04-07T00:00:00Z",
					},
					{
						documentId: "doc-2",
						title: null,
						description: null,
						metadata: {},
						score: 0.72,
						tags: [],
						version: "1",
						tenantId: "tenant-uuid-1234",
						updatedAt: "2026-04-07T00:00:00Z",
					},
				],
				nextCursor: null,
			});

			const store = makeStore();
			const result = await store.query({ queryStr: "quantum cryptography", similarityTopK: 5 });

			expect(result.ids).toEqual(["doc-1", "doc-2"]);
			expect(result.similarities).toEqual([0.95, 0.72]);
			expect(result.nodes[0]).toMatchObject({ id_: "doc-1", text: "PQC overview" });
			// null title falls back to documentId
			expect(result.nodes[1]).toMatchObject({ id_: "doc-2", text: "doc-2" });

			expect(mockSearchWithAutoSse).toHaveBeenCalledWith({
				tenantId: "tenant-uuid-1234",
				query: "quantum cryptography",
				limit: 5,
			});
		});

		it("defaults similarityTopK to 10", async () => {
			mockSearchWithAutoSse.mockResolvedValueOnce({ items: [], nextCursor: null });
			const store = makeStore();
			await store.query({ queryStr: "test" });

			expect(mockSearchWithAutoSse).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
		});

		it("skips hits that fail schema validation", async () => {
			mockSearchWithAutoSse.mockResolvedValueOnce({
				items: [
					// valid
					{
						documentId: "doc-1",
						title: "valid",
						description: null,
						metadata: {},
						score: 0.9,
					},
					// invalid — missing score
					{ documentId: "doc-2", title: "bad", description: null, metadata: {} },
				],
				nextCursor: null,
			});

			const store = makeStore();
			const result = await store.query({ queryStr: "test" });
			expect(result.ids).toEqual(["doc-1"]);
		});

		it("propagates search errors", async () => {
			mockSearchWithAutoSse.mockRejectedValueOnce(new Error("Search API error: 429"));
			const store = makeStore();
			await expect(store.query({ queryStr: "test" })).rejects.toThrow("Search API error: 429");
		});
	});

	describe("delete()", () => {
		it("tombstones the document by re-indexing with __deleted__ tag", async () => {
			const store = makeStore();
			await store.delete("node-to-delete");

			expect(mockIndexDocumentWithAutoSse).toHaveBeenCalledOnce();
			const call = mockIndexDocumentWithAutoSse.mock.calls[0]?.[0];
			expect(call).toMatchObject({
				tenantId: "tenant-uuid-1234",
				documentId: "node-to-delete",
				version: "deleted",
				body: null,
				tags: ["__deleted__"],
				metadata: expect.objectContaining({ deleted: true }),
			});
		});

		it("propagates delete errors", async () => {
			mockIndexDocumentWithAutoSse.mockRejectedValueOnce(new Error("Search API error: 500"));
			const store = makeStore();
			await expect(store.delete("n1")).rejects.toThrow("Search API error: 500");
		});
	});
});
