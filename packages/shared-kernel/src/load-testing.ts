/**
 * Load Testing Utilities
 *
 * Provides standardized load testing patterns for QNSP services.
 * Used for validating system capacity and identifying bottlenecks under load.
 */

export interface LoadTestConfig {
	name: string;
	targetUrl: string;
	method?: "GET" | "POST" | "PUT" | "DELETE";
	headers?: Record<string, string>;
	body?: unknown;
	concurrency: number;
	totalRequests: number;
	rampUpSeconds?: number;
	timeoutMs?: number;
}

export interface LoadTestResult {
	name: string;
	config: {
		concurrency: number;
		totalRequests: number;
		targetUrl: string;
	};
	metrics: {
		totalRequests: number;
		successfulRequests: number;
		failedRequests: number;
		totalDurationMs: number;
		requestsPerSecond: number;
		avgResponseTimeMs: number;
		minResponseTimeMs: number;
		maxResponseTimeMs: number;
		p50ResponseTimeMs: number;
		p95ResponseTimeMs: number;
		p99ResponseTimeMs: number;
	};
	statusCodes: Record<number, number>;
	errors: Array<{ message: string; count: number }>;
	timestamp: string;
}

interface RequestResult {
	success: boolean;
	statusCode: number;
	responseTimeMs: number;
	error?: string;
}

/**
 * Executes a single HTTP request and measures response time
 */
async function executeRequest(config: LoadTestConfig): Promise<RequestResult> {
	const start = performance.now();
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 30000);

	try {
		const fetchOptions: RequestInit = {
			method: config.method ?? "GET",
			signal: controller.signal,
		};
		if (config.headers !== undefined) {
			fetchOptions.headers = config.headers;
		}
		if (config.body !== undefined) {
			fetchOptions.body = JSON.stringify(config.body);
		}

		const response = await fetch(config.targetUrl, fetchOptions);
		const responseTimeMs = performance.now() - start;

		return {
			success: response.ok,
			statusCode: response.status,
			responseTimeMs,
		};
	} catch (error) {
		const responseTimeMs = performance.now() - start;
		return {
			success: false,
			statusCode: 0,
			responseTimeMs,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	} finally {
		clearTimeout(timeout);
	}
}

/**
 * Runs a batch of concurrent requests
 */
async function runBatch(config: LoadTestConfig, batchSize: number): Promise<RequestResult[]> {
	const promises: Promise<RequestResult>[] = [];
	for (let i = 0; i < batchSize; i++) {
		promises.push(executeRequest(config));
	}
	return Promise.all(promises);
}

/**
 * Runs a load test against a target URL
 */
export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
	const results: RequestResult[] = [];
	const startTime = performance.now();

	let remaining = config.totalRequests;
	while (remaining > 0) {
		const batchSize = Math.min(config.concurrency, remaining);
		const batchResults = await runBatch(config, batchSize);
		results.push(...batchResults);
		remaining -= batchSize;
	}

	const totalDurationMs = performance.now() - startTime;

	const responseTimes = results.map((r) => r.responseTimeMs).sort((a, b) => a - b);
	const successfulRequests = results.filter((r) => r.success).length;
	const failedRequests = results.filter((r) => !r.success).length;

	const statusCodes: Record<number, number> = {};
	for (const result of results) {
		statusCodes[result.statusCode] = (statusCodes[result.statusCode] ?? 0) + 1;
	}

	const errorMap = new Map<string, number>();
	for (const result of results) {
		if (result.error) {
			errorMap.set(result.error, (errorMap.get(result.error) ?? 0) + 1);
		}
	}
	const errors = Array.from(errorMap.entries()).map(([message, count]) => ({
		message,
		count,
	}));

	const avgResponseTimeMs = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

	return {
		name: config.name,
		config: {
			concurrency: config.concurrency,
			totalRequests: config.totalRequests,
			targetUrl: config.targetUrl,
		},
		metrics: {
			totalRequests: results.length,
			successfulRequests,
			failedRequests,
			totalDurationMs,
			requestsPerSecond: (results.length / totalDurationMs) * 1000,
			avgResponseTimeMs,
			minResponseTimeMs: responseTimes[0] ?? 0,
			maxResponseTimeMs: responseTimes[responseTimes.length - 1] ?? 0,
			p50ResponseTimeMs: responseTimes[Math.floor(responseTimes.length * 0.5)] ?? 0,
			p95ResponseTimeMs: responseTimes[Math.floor(responseTimes.length * 0.95)] ?? 0,
			p99ResponseTimeMs: responseTimes[Math.floor(responseTimes.length * 0.99)] ?? 0,
		},
		statusCodes,
		errors,
		timestamp: new Date().toISOString(),
	};
}

/**
 * Formats load test results as markdown
 */
export function formatLoadTestResults(result: LoadTestResult): string {
	const lines: string[] = [
		`# Load Test Results: ${result.name}`,
		``,
		`**Timestamp:** ${result.timestamp}`,
		`**Target:** ${result.config.targetUrl}`,
		`**Concurrency:** ${result.config.concurrency}`,
		`**Total Requests:** ${result.config.totalRequests}`,
		``,
		`## Metrics`,
		``,
		`| Metric | Value |`,
		`|--------|-------|`,
		`| Total Duration | ${result.metrics.totalDurationMs.toFixed(2)}ms |`,
		`| Requests/sec | ${result.metrics.requestsPerSecond.toFixed(2)} |`,
		`| Success Rate | ${((result.metrics.successfulRequests / result.metrics.totalRequests) * 100).toFixed(2)}% |`,
		`| Avg Response | ${result.metrics.avgResponseTimeMs.toFixed(2)}ms |`,
		`| P50 Response | ${result.metrics.p50ResponseTimeMs.toFixed(2)}ms |`,
		`| P95 Response | ${result.metrics.p95ResponseTimeMs.toFixed(2)}ms |`,
		`| P99 Response | ${result.metrics.p99ResponseTimeMs.toFixed(2)}ms |`,
		``,
		`## Status Codes`,
		``,
	];

	for (const [code, count] of Object.entries(result.statusCodes)) {
		lines.push(`- **${code}**: ${count}`);
	}

	if (result.errors.length > 0) {
		lines.push(``, `## Errors`, ``);
		for (const error of result.errors) {
			lines.push(`- ${error.message}: ${error.count}`);
		}
	}

	return lines.join("\n");
}

/**
 * Standard load test scenarios
 */
export const LOAD_TEST_SCENARIOS = {
	SMOKE: { concurrency: 1, totalRequests: 10 },
	LIGHT: { concurrency: 5, totalRequests: 100 },
	MEDIUM: { concurrency: 20, totalRequests: 500 },
	HEAVY: { concurrency: 50, totalRequests: 1000 },
	STRESS: { concurrency: 100, totalRequests: 5000 },
} as const;

/**
 * Creates a load test config for a health endpoint
 */
export function createHealthCheckLoadTest(
	baseUrl: string,
	scenario: keyof typeof LOAD_TEST_SCENARIOS = "LIGHT",
): LoadTestConfig {
	const { concurrency, totalRequests } = LOAD_TEST_SCENARIOS[scenario];
	return {
		name: `Health Check - ${scenario}`,
		targetUrl: `${baseUrl}/health`,
		method: "GET",
		concurrency,
		totalRequests,
		timeoutMs: 5000,
	};
}
