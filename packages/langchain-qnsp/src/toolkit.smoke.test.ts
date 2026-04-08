/**
 * Smoke tests for @qnsp/langchain-qnsp
 *
 * Verifies that the package exports are importable and classes can be instantiated.
 * No API key or network access required — catches build regressions.
 *
 * Run: pnpm --filter @qnsp/langchain-qnsp test
 */

import { describe, expect, it } from "vitest";
import { QnspToolkit } from "./toolkit.js";

describe("QnspToolkit smoke", () => {
	it("exports QnspToolkit class", () => {
		expect(QnspToolkit).toBeDefined();
		expect(typeof QnspToolkit).toBe("function");
	});

	it("constructs with minimal config", () => {
		const toolkit = new QnspToolkit({ apiKey: "smoke-test-key" });
		expect(toolkit).toBeInstanceOf(QnspToolkit);
	});

	it("getTools returns an array", () => {
		const toolkit = new QnspToolkit({ apiKey: "smoke-test-key" });
		const tools = toolkit.getTools();
		expect(Array.isArray(tools)).toBe(true);
		expect(tools.length).toBe(6);
	});

	it("each tool has name, description, and schema", () => {
		const toolkit = new QnspToolkit({ apiKey: "smoke-test-key" });
		for (const tool of toolkit.getTools()) {
			expect(typeof tool.name).toBe("string");
			expect(tool.name.length).toBeGreaterThan(0);
			expect(typeof tool.description).toBe("string");
			expect(tool.description.length).toBeGreaterThan(0);
			expect(tool.schema).toBeDefined();
		}
	});

	it("getVaultTools, getKmsTools, getAuditTools return correct counts", () => {
		const toolkit = new QnspToolkit({ apiKey: "smoke-test-key" });
		expect(toolkit.getVaultTools()).toHaveLength(3);
		expect(toolkit.getKmsTools()).toHaveLength(2);
		expect(toolkit.getAuditTools()).toHaveLength(1);
	});

	it("include filter restricts returned tools", () => {
		const vaultOnly = new QnspToolkit({ apiKey: "smoke-test-key", include: ["vault"] });
		expect(vaultOnly.getTools()).toHaveLength(3);

		const kmsOnly = new QnspToolkit({ apiKey: "smoke-test-key", include: ["kms"] });
		expect(kmsOnly.getTools()).toHaveLength(2);

		const auditOnly = new QnspToolkit({ apiKey: "smoke-test-key", include: ["audit"] });
		expect(auditOnly.getTools()).toHaveLength(1);
	});
});
