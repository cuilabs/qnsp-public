import { createServer } from "node:http";

import { afterEach, describe, expect, it } from "vitest";

import { CryptoInventoryClient } from "./index.js";

type CapturedRequest = {
	readonly url: string;
	readonly method: string;
	readonly headers: Record<string, string | string[] | undefined>;
};

function createUpstream(): Promise<{
	readonly baseUrl: string;
	readonly getCaptured: () => CapturedRequest | null;
	readonly close: () => Promise<void>;
}> {
	let captured: CapturedRequest | null = null;
	const server = createServer((req, res) => {
		captured = {
			url: req.url ?? "",
			method: req.method ?? "",
			headers: req.headers,
		};

		if (req.url?.startsWith("/billing/v1/sdk/activate") && req.method === "POST") {
			res.statusCode = 200;
			res.setHeader("content-type", "application/json");
			res.end(
				JSON.stringify({
					activated: true,
					tenantId: "a1b2c3d4-e5f6-4789-8abc-def012345678",
					tier: "dev-pro",
					activationToken: "tok_test",
					expiresInSeconds: 3600,
					activatedAt: new Date().toISOString(),
					limits: {
						storageGB: 50,
						apiCalls: 100_000,
						enclavesEnabled: false,
						aiTrainingEnabled: false,
						aiInferenceEnabled: true,
						sseEnabled: true,
						vaultEnabled: true,
					},
				}),
			);
			return;
		}

		if (req.url?.startsWith("/crypto/v1/assets/discover") && req.method === "POST") {
			res.statusCode = 200;
			res.setHeader("content-type", "application/json");
			res.end(JSON.stringify({ runs: [] }));
			return;
		}

		if (req.url?.startsWith("/crypto/v1/discovery/jobs") && req.method === "GET") {
			res.statusCode = 200;
			res.setHeader("content-type", "application/json");
			res.end(JSON.stringify({ jobs: [], count: 0 }));
			return;
		}

		if (req.url?.startsWith("/crypto/v1/discovery/runs") && req.method === "GET") {
			res.statusCode = 200;
			res.setHeader("content-type", "application/json");
			res.end(JSON.stringify({ runs: [] }));
			return;
		}

		res.statusCode = 404;
		res.setHeader("content-type", "application/json");
		res.end(JSON.stringify({ error: "not found" }));
	});

	return new Promise((resolve, reject) => {
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (!address || typeof address === "string") {
				reject(new Error("Failed to bind upstream"));
				return;
			}
			resolve({
				baseUrl: `http://127.0.0.1:${address.port}`,
				getCaptured: () => captured,
				close: () =>
					new Promise((closeResolve, closeReject) => {
						server.close((err) => (err ? closeReject(err) : closeResolve()));
					}),
			});
		});
	});
}

describe("CryptoInventoryClient", () => {
	let upstream: Awaited<ReturnType<typeof createUpstream>> | null = null;

	afterEach(async () => {
		if (upstream) {
			await upstream.close();
			upstream = null;
		}
	});

	it("propagates x-qnsp-tenant for discoverAssets when tenantId is provided", async () => {
		upstream = await createUpstream();
		const client = new CryptoInventoryClient({ baseUrl: upstream.baseUrl, apiKey: "test-key" });
		const tenantId = "00000000-0000-4000-8000-000000000001";

		await client.discoverAssets({ tenantId, source: "kms" });
		const captured = upstream.getCaptured();
		expect(captured?.method).toBe("POST");
		expect(captured?.url).toBe("/crypto/v1/assets/discover");
		expect(captured?.headers["x-qnsp-tenant"]).toBe(tenantId);
		expect(captured?.headers["authorization"]).toBe("Bearer test-key");
	});

	it("propagates x-qnsp-tenant for listDiscoveryJobs when tenantId is provided", async () => {
		upstream = await createUpstream();
		const client = new CryptoInventoryClient({ baseUrl: upstream.baseUrl, apiKey: "test-key" });
		const tenantId = "00000000-0000-4000-8000-000000000002";

		await client.listDiscoveryJobs({ tenantId, status: "running", limit: 10, offset: 0 });
		const captured = upstream.getCaptured();
		expect(captured?.method).toBe("GET");
		expect(captured?.url).toBe(
			`/crypto/v1/discovery/jobs?tenantId=${tenantId}&status=running&limit=10&offset=0`,
		);
		expect(captured?.headers["x-qnsp-tenant"]).toBe(tenantId);
		expect(captured?.headers["authorization"]).toBe("Bearer test-key");
	});

	it("propagates x-qnsp-tenant for getDiscoveryRuns when tenantId is provided", async () => {
		upstream = await createUpstream();
		const client = new CryptoInventoryClient({ baseUrl: upstream.baseUrl, apiKey: "test-key" });
		const tenantId = "00000000-0000-4000-8000-000000000003";

		await client.getDiscoveryRuns(tenantId, 25);
		const captured = upstream.getCaptured();
		expect(captured?.method).toBe("GET");
		expect(captured?.url).toBe(`/crypto/v1/discovery/runs?tenantId=${tenantId}&limit=25`);
		expect(captured?.headers["x-qnsp-tenant"]).toBe(tenantId);
		expect(captured?.headers["authorization"]).toBe("Bearer test-key");
	});
});
