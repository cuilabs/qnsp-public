import { describe, expect, it } from "vitest";

import { CircuitBreaker, CircuitBreakerOpenError } from "./circuit-breaker.js";

describe("CircuitBreaker", () => {
	it("executes actions successfully when closed", async () => {
		const breaker = new CircuitBreaker({ failureThreshold: 2 });

		const result = await breaker.execute(async () => "ok");

		expect(result).toBe("ok");
		expect(breaker.getState()).toBe("closed");
		expect(breaker.getFailures()).toBe(0);
	});

	it("opens after failures and blocks subsequent calls", async () => {
		const breaker = new CircuitBreaker({ failureThreshold: 1, timeout: 60_000 });

		await expect(
			breaker.execute(async () => {
				throw new Error("failure");
			}),
		).rejects.toThrowError("failure");

		expect(breaker.getState()).toBe("open");

		await expect(breaker.execute(async () => "should-not-run")).rejects.toBeInstanceOf(
			CircuitBreakerOpenError,
		);
	});
});
