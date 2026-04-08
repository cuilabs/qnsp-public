import { describe, expect, it } from "vitest";

import {
	componentStatusSchema,
	createHealthStatus,
	createStandardHealthResponse,
	createStandardReadyResponse,
	healthStatusSchema,
	standardHealthResponseSchema,
	standardReadyResponseSchema,
} from "./health.js";

describe("shared-kernel/health", () => {
	it("creates a valid health payload", () => {
		const status = createHealthStatus("test-service", "ok", {
			version: "1.0.0",
			components: {
				db: "ok",
				queue: "degraded",
			},
		});

		expect(healthStatusSchema.safeParse(status).success).toBe(true);
		expect(status).toMatchObject({
			service: "test-service",
			status: "ok",
			version: "1.0.0",
			components: {
				db: "ok",
				queue: "degraded",
			},
		});
	});

	it("rejects invalid component statuses", () => {
		expect(() => componentStatusSchema.parse("unknown")).toThrow();
		const result = componentStatusSchema.safeParse("unknown");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toContain("Invalid option");
			expect(result.error.issues[0]?.message).toContain("ok");
			expect(result.error.issues[0]?.message).toContain("degraded");
			expect(result.error.issues[0]?.message).toContain("critical");
		}
	});

	it("creates a standard health response", () => {
		const response = createStandardHealthResponse("svc", "1.2.3", {
			checks: {
				db: { status: "ok", latencyMs: 12, lastCheckedAt: new Date().toISOString() },
			},
		});

		expect(standardHealthResponseSchema.safeParse(response).success).toBe(true);
		expect(response.service).toBe("svc");
		expect(response.version).toBe("1.2.3");
		expect(response.status).toBe("ok");
		expect(response.uptime).toBeGreaterThanOrEqual(0);
		expect(response.checks?.["db"]?.status).toBe("ok");
		expect(response.checks?.["db"]?.latencyMs).toBe(12);
	});

	it("creates a standard ready response", () => {
		const response = createStandardReadyResponse("svc", true, {
			checks: {
				db: { ready: true },
				queue: { ready: false, message: "down" },
			},
		});

		expect(standardReadyResponseSchema.safeParse(response).success).toBe(true);
		expect(response.service).toBe("svc");
		expect(response.ready).toBe(true);
		expect(response.checks?.["db"]?.ready).toBe(true);
		expect(response.checks?.["queue"]).toEqual({ ready: false, message: "down" });
	});
});
