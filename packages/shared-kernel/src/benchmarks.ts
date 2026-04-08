/**
 * Performance Benchmarking Utilities
 *
 * Provides standardized performance measurement and reporting for QNSP services.
 * Used for validating performance SLAs and identifying bottlenecks.
 */

export interface BenchmarkResult {
	name: string;
	iterations: number;
	totalMs: number;
	avgMs: number;
	minMs: number;
	maxMs: number;
	p50Ms: number;
	p95Ms: number;
	p99Ms: number;
	opsPerSecond: number;
}

export interface BenchmarkSuite {
	suiteName: string;
	timestamp: string;
	results: BenchmarkResult[];
	environment: {
		nodeVersion: string;
		platform: string;
		cpuCount: number;
	};
}

/**
 * Measures execution time of a function over multiple iterations
 */
export async function benchmark(
	name: string,
	fn: () => Promise<void> | void,
	iterations = 100,
): Promise<BenchmarkResult> {
	const timings: number[] = [];

	for (let i = 0; i < iterations; i++) {
		const start = performance.now();
		await fn();
		const end = performance.now();
		timings.push(end - start);
	}

	timings.sort((a, b) => a - b);

	const totalMs = timings.reduce((sum, t) => sum + t, 0);
	const avgMs = totalMs / iterations;
	const minMs = timings[0] ?? 0;
	const maxMs = timings[timings.length - 1] ?? 0;
	const p50Ms = timings[Math.floor(iterations * 0.5)] ?? 0;
	const p95Ms = timings[Math.floor(iterations * 0.95)] ?? 0;
	const p99Ms = timings[Math.floor(iterations * 0.99)] ?? 0;
	const opsPerSecond = avgMs > 0 ? 1000 / avgMs : 0;

	return {
		name,
		iterations,
		totalMs,
		avgMs,
		minMs,
		maxMs,
		p50Ms,
		p95Ms,
		p99Ms,
		opsPerSecond,
	};
}

/**
 * Runs multiple benchmarks and collects results
 */
export async function runBenchmarkSuite(
	suiteName: string,
	benchmarks: Array<{
		name: string;
		fn: () => Promise<void> | void;
		iterations?: number;
	}>,
): Promise<BenchmarkSuite> {
	const results: BenchmarkResult[] = [];

	for (const bench of benchmarks) {
		const result = await benchmark(bench.name, bench.fn, bench.iterations ?? 100);
		results.push(result);
	}

	const isNode = typeof process !== "undefined" && process.versions?.node;
	const cpuCount = isNode ? (await import("node:os")).cpus().length : 1;

	return {
		suiteName,
		timestamp: new Date().toISOString(),
		results,
		environment: {
			nodeVersion: isNode ? process.version : "browser",
			platform: isNode ? process.platform : "browser",
			cpuCount,
		},
	};
}

/**
 * Formats benchmark results as a markdown table
 */
export function formatBenchmarkResults(suite: BenchmarkSuite): string {
	const lines: string[] = [
		`# Benchmark Results: ${suite.suiteName}`,
		``,
		`**Timestamp:** ${suite.timestamp}`,
		`**Node:** ${suite.environment.nodeVersion}`,
		`**Platform:** ${suite.environment.platform}`,
		`**CPUs:** ${suite.environment.cpuCount}`,
		``,
		`| Benchmark | Iterations | Avg (ms) | P50 (ms) | P95 (ms) | P99 (ms) | ops/sec |`,
		`|-----------|------------|----------|----------|----------|----------|---------|`,
	];

	for (const result of suite.results) {
		lines.push(
			`| ${result.name} | ${result.iterations} | ${result.avgMs.toFixed(3)} | ${result.p50Ms.toFixed(3)} | ${result.p95Ms.toFixed(3)} | ${result.p99Ms.toFixed(3)} | ${result.opsPerSecond.toFixed(1)} |`,
		);
	}

	return lines.join("\n");
}

/**
 * Standard performance SLA thresholds
 */
export const PERFORMANCE_SLAS = {
	API_RESPONSE_P95_MS: 200,
	API_RESPONSE_P99_MS: 500,
	HEALTH_CHECK_P99_MS: 50,
	AUTH_TOKEN_VALIDATION_P99_MS: 10,
	ENCRYPTION_OP_P99_MS: 5,
	DB_QUERY_P95_MS: 100,
} as const;

/**
 * Validates benchmark results against SLAs
 */
export function validateAgainstSLAs(
	result: BenchmarkResult,
	slaThresholdMs: number,
	percentile: "p50" | "p95" | "p99" = "p95",
): { passed: boolean; actualMs: number; thresholdMs: number } {
	const actualMs =
		percentile === "p50" ? result.p50Ms : percentile === "p95" ? result.p95Ms : result.p99Ms;

	return {
		passed: actualMs <= slaThresholdMs,
		actualMs,
		thresholdMs: slaThresholdMs,
	};
}
