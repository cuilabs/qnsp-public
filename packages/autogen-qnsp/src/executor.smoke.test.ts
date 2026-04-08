/**
 * Smoke tests for @qnsp/autogen-qnsp
 *
 * Verifies that the package exports are importable and classes can be instantiated.
 * No API key or network access required — catches build regressions.
 *
 * Run: pnpm --filter @qnsp/autogen-qnsp test
 */

import { describe, expect, it } from "vitest";
import { QnspExecutor } from "./executor.js";

describe("QnspExecutor smoke", () => {
	it("exports QnspExecutor class", () => {
		expect(QnspExecutor).toBeDefined();
		expect(typeof QnspExecutor).toBe("function");
	});

	it("constructs with only an API key", () => {
		const executor = new QnspExecutor({ apiKey: "smoke-test-key" });
		expect(executor).toBeInstanceOf(QnspExecutor);
	});

	it("constructs with full config", () => {
		const executor = new QnspExecutor({
			apiKey: "smoke-test-key",
			tenantId: "tenant-123",
			baseUrl: "http://localhost:3000",
			containerImage: "custom-image:latest",
			cpu: 2,
			memoryGiB: 4,
			gpu: 1,
			acceleratorType: "nvidia-a100",
			pollTimeoutMs: 60_000,
			pollIntervalMs: 5_000,
		});
		expect(executor).toBeInstanceOf(QnspExecutor);
	});

	it("has execute method", () => {
		const executor = new QnspExecutor({ apiKey: "smoke-test-key" });
		expect(typeof executor.execute).toBe("function");
	});

	it("rejects unsupported language synchronously", async () => {
		const executor = new QnspExecutor({ apiKey: "smoke-test-key" });
		await expect(
			// @ts-expect-error — intentionally passing invalid language
			executor.execute({ code: "SELECT 1", language: "sql" }),
		).rejects.toThrow("Unsupported language: sql");
	});
});
