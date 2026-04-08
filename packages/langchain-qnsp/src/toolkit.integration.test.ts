/**
 * Integration tests for @qnsp/langchain-qnsp
 *
 * These tests hit the real QNSP API via edge gateway.
 * Requires QNSP_API_KEY env var — the API key resolves tenant, tier, and policy automatically.
 *
 * Run: QNSP_API_KEY=qnsp_... pnpm --filter @qnsp/langchain-qnsp test:integration
 */

import { describe, expect, it } from "vitest";
import { QnspToolkit } from "./toolkit.js";

const QNSP_API_KEY = process.env["QNSP_API_KEY"];

describe.skipIf(!QNSP_API_KEY)("QnspToolkit integration", () => {
	it("instantiates toolkit with only an API key", () => {
		const toolkit = new QnspToolkit({ apiKey: QNSP_API_KEY! });
		const tools = toolkit.getTools();
		expect(tools.length).toBeGreaterThan(0);
		for (const tool of tools) {
			expect(tool.name).toBeTruthy();
			expect(tool.description).toBeTruthy();
		}
	});

	it("vault read returns a structured error for non-existent secret", async () => {
		const toolkit = new QnspToolkit({ apiKey: QNSP_API_KEY! });
		const [readTool] = toolkit.getVaultTools();
		if (!readTool) throw new Error("No read tool");

		// A non-existent UUID should return a 404 from vault-service
		await expect(
			readTool.invoke({ secretId: "00000000-0000-0000-0000-000000000000" }),
		).rejects.toThrow();
	});

	it("kms sign returns a structured error for non-existent key", async () => {
		const toolkit = new QnspToolkit({ apiKey: QNSP_API_KEY! });
		const [signTool] = toolkit.getKmsTools();
		if (!signTool) throw new Error("No sign tool");

		await expect(
			signTool.invoke({
				keyId: "00000000-0000-0000-0000-000000000000",
				data: btoa("test-data"),
			}),
		).rejects.toThrow();
	});
});
