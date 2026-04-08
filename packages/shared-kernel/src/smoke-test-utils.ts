/**
 * Standardized Smoke Test Utilities
 *
 * Provides reusable patterns for smoke testing QNSP services.
 * All smoke tests should follow this structure for consistency and auditability.
 */

export interface SmokeTestResult {
	name: string;
	passed: boolean;
	durationMs: number;
	error?: string;
	details?: Record<string, unknown>;
}

export interface SmokeTestSuite {
	serviceName: string;
	version: string;
	timestamp: string;
	results: SmokeTestResult[];
	summary: {
		total: number;
		passed: number;
		failed: number;
		durationMs: number;
	};
}

export interface HealthCheckResponse {
	status: "healthy" | "degraded" | "unhealthy";
	version?: string;
	checks?: Record<string, { status: string; latencyMs?: number }>;
}

/**
 * Standard smoke test runner that executes tests and collects results
 */
export async function runSmokeTests(
	serviceName: string,
	version: string,
	tests: Array<{
		name: string;
		fn: () => Promise<void>;
	}>,
): Promise<SmokeTestSuite> {
	const startTime = Date.now();
	const results: SmokeTestResult[] = [];

	for (const test of tests) {
		const testStart = Date.now();
		try {
			await test.fn();
			results.push({
				name: test.name,
				passed: true,
				durationMs: Date.now() - testStart,
			});
		} catch (error) {
			results.push({
				name: test.name,
				passed: false,
				durationMs: Date.now() - testStart,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	const passed = results.filter((r) => r.passed).length;
	const failed = results.filter((r) => !r.passed).length;

	return {
		serviceName,
		version,
		timestamp: new Date().toISOString(),
		results,
		summary: {
			total: results.length,
			passed,
			failed,
			durationMs: Date.now() - startTime,
		},
	};
}

/**
 * Standard health endpoint smoke test
 */
export async function testHealthEndpoint(
	baseUrl: string,
	timeoutMs = 5000,
): Promise<HealthCheckResponse> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${baseUrl}/health`, {
			method: "GET",
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error(`Health check failed with status ${response.status}`);
		}

		const body = (await response.json()) as HealthCheckResponse;
		if (body.status !== "healthy" && body.status !== "degraded") {
			throw new Error(`Service unhealthy: ${body.status}`);
		}

		return body;
	} finally {
		clearTimeout(timeout);
	}
}

/**
 * Standard API endpoint smoke test
 */
export async function testApiEndpoint(
	url: string,
	options: {
		method?: string;
		headers?: Record<string, string>;
		body?: unknown;
		expectedStatus?: number;
		timeoutMs?: number;
	} = {},
): Promise<{ status: number; body: unknown }> {
	const { method = "GET", headers = {}, body, expectedStatus = 200, timeoutMs = 10000 } = options;

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const fetchOptions: RequestInit = {
			method,
			headers: {
				"content-type": "application/json",
				...headers,
			},
			signal: controller.signal,
		};
		if (body !== undefined) {
			fetchOptions.body = JSON.stringify(body);
		}
		const response = await fetch(url, fetchOptions);

		const responseBody = await response.json().catch(() => null);

		if (response.status !== expectedStatus) {
			throw new Error(
				`Expected status ${expectedStatus}, got ${response.status}: ${JSON.stringify(responseBody)}`,
			);
		}

		return { status: response.status, body: responseBody };
	} finally {
		clearTimeout(timeout);
	}
}

/**
 * Format smoke test results for logging/audit
 */
export function formatSmokeTestReport(suite: SmokeTestSuite): string {
	const lines: string[] = [
		`=== Smoke Test Report: ${suite.serviceName} ===`,
		`Version: ${suite.version}`,
		`Timestamp: ${suite.timestamp}`,
		``,
		`Summary: ${suite.summary.passed}/${suite.summary.total} passed (${suite.summary.durationMs}ms)`,
		``,
		`Results:`,
	];

	for (const result of suite.results) {
		const status = result.passed ? "✅ PASS" : "❌ FAIL";
		lines.push(`  ${status} ${result.name} (${result.durationMs}ms)`);
		if (result.error) {
			lines.push(`         Error: ${result.error}`);
		}
	}

	return lines.join("\n");
}
