/**
 * Integration tests for the @cuilabs/qnsp/langchain subpath.
 *
 * These tests hit the real QNSP API via the edge gateway.
 * Requires QNSP_API_KEY — the API key resolves tenant, tier, and policy.
 *
 * Run: QNSP_API_KEY=qnsp_... npx vitest run src/langchain/toolkit.integration.test.ts
 *
 * NOTE: `QnspToolkit` requires `await toolkit.activate()` (a real
 * billing-service activation handshake) before `getTools()` — the toolkit
 * enforces this with `#assertActivated()`. Every test below activates first,
 * matching the documented API contract and the unit suite's
 * `activatedToolkit()` helper.
 */

import { describe, expect, it } from "vitest";
import { QnspToolkit } from "./toolkit.js";

const QNSP_API_KEY = process.env["QNSP_API_KEY"];

describe.skipIf(!QNSP_API_KEY)("QnspToolkit integration", () => {
	it("activates against production and exposes the tool set", async () => {
		const toolkit = new QnspToolkit({ apiKey: QNSP_API_KEY! });
		await toolkit.activate();
		expect(toolkit.isActivated).toBe(true);

		const tools = toolkit.getTools();
		expect(tools.length).toBeGreaterThan(0);
		for (const tool of tools) {
			expect(tool.name).toBeTruthy();
			expect(tool.description).toBeTruthy();
		}
	});

	it("vault read returns a structured error for a non-existent secret", async () => {
		const toolkit = new QnspToolkit({ apiKey: QNSP_API_KEY! });
		await toolkit.activate();
		const [readTool] = toolkit.getVaultTools();
		if (!readTool) throw new Error("No read tool");

		// A well-formed but non-existent UUID must surface a structured error
		// (404 from vault-service via the edge gateway), not a crash.
		await expect(
			readTool.invoke({ secretId: "00000000-0000-0000-0000-000000000000" }),
		).rejects.toThrow();
	});

	it("kms sign returns a structured error for a non-existent key", async () => {
		const toolkit = new QnspToolkit({ apiKey: QNSP_API_KEY! });
		await toolkit.activate();
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
