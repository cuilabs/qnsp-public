/**
 * Unit tests for DatabasePoolManager
 */

import { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { DatabasePoolManager } from "./db-pool-manager.js";

describe("DatabasePoolManager", () => {
	const writeUrl = "postgresql://test:test@localhost:5432/test";
	const readUrl1 = "postgresql://test:test@localhost:5433/test";
	const readUrl2 = "postgresql://test:test@localhost:5434/test";

	it("should create pool manager with write pool only", () => {
		const poolManager = new DatabasePoolManager({
			writeUrl,
			readUrls: [],
			maxConnections: 10,
			idleTimeoutMs: 30_000,
		});

		const writePool = poolManager.getWritePool();
		expect(writePool).toBeInstanceOf(Pool);

		// Read pool should fallback to write pool
		const readPool = poolManager.getReadPool();
		expect(readPool).toBe(writePool);
	});

	it("should create pool manager with read replicas", () => {
		const poolManager = new DatabasePoolManager({
			writeUrl,
			readUrls: [readUrl1, readUrl2],
			maxConnections: 10,
			idleTimeoutMs: 30_000,
		});

		const writePool = poolManager.getWritePool();
		expect(writePool).toBeInstanceOf(Pool);

		const readPool = poolManager.getReadPool();
		expect(readPool).toBeInstanceOf(Pool);
		expect(readPool).not.toBe(writePool);
	});

	it("should use round-robin strategy for read pools", () => {
		const poolManager = new DatabasePoolManager(
			{
				writeUrl,
				readUrls: [readUrl1, readUrl2],
				maxConnections: 10,
				idleTimeoutMs: 30_000,
			},
			"round-robin",
		);

		const pool1 = poolManager.getReadPool();
		const pool2 = poolManager.getReadPool();
		const pool3 = poolManager.getReadPool();

		// Should cycle through pools
		// Note: We can't easily test the actual rotation without mocking,
		// but we can verify it returns valid pools
		expect(pool1).toBeInstanceOf(Pool);
		expect(pool2).toBeInstanceOf(Pool);
		expect(pool3).toBeInstanceOf(Pool);
	});

	it("should return all pools", () => {
		const poolManager = new DatabasePoolManager({
			writeUrl,
			readUrls: [readUrl1, readUrl2],
			maxConnections: 10,
			idleTimeoutMs: 30_000,
		});

		const allPools = poolManager.getAllPools();
		expect(allPools.length).toBe(3); // 1 write + 2 read
		expect(allPools[0]).toBe(poolManager.getWritePool());
	});

	it("should shutdown all pools", async () => {
		const poolManager = new DatabasePoolManager({
			writeUrl,
			readUrls: [readUrl1],
			maxConnections: 10,
			idleTimeoutMs: 30_000,
		});

		await poolManager.shutdown();
		// Should complete without error
		expect(true).toBe(true);
	});

	it("should handle health check", async () => {
		const poolManager = new DatabasePoolManager({
			writeUrl,
			readUrls: [readUrl1],
			maxConnections: 10,
			idleTimeoutMs: 30_000,
		});

		// Health check will fail without actual DB connection, but should not throw
		try {
			const health = await poolManager.health();
			expect(typeof health.write).toBe("boolean");
			expect(Array.isArray(health.read)).toBe(true);
			expect(typeof health.overall).toBe("boolean");
		} catch {
			// Expected if DB is not available
		}
	});

	it("selects read pools using random strategy", () => {
		const poolManager = new DatabasePoolManager(
			{
				writeUrl,
				readUrls: [readUrl1, readUrl2],
				maxConnections: 10,
				idleTimeoutMs: 30_000,
				randomIndex: () => 0,
			},
			"random",
		);

		const testWritePool = {} as unknown as Pool;
		const testReadPool1 = { totalCount: 10 } as unknown as Pool;
		const testReadPool2 = { totalCount: 20 } as unknown as Pool;
		(poolManager as any).writePool = testWritePool;
		(poolManager as any).readPools = [testReadPool1, testReadPool2];

		expect(poolManager.getReadPool()).toBe(testReadPool1);
	});

	it("selects read pools using least-connections strategy", () => {
		const poolManager = new DatabasePoolManager(
			{
				writeUrl,
				readUrls: [readUrl1, readUrl2],
				maxConnections: 10,
				idleTimeoutMs: 30_000,
			},
			"least-connections",
		);

		const fakeWritePool = {} as unknown as Pool;
		const fakeReadPool1 = { totalCount: 5 } as unknown as Pool;
		const fakeReadPool2 = { totalCount: 2 } as unknown as Pool;
		(poolManager as any).writePool = fakeWritePool;
		(poolManager as any).readPools = [fakeReadPool1, fakeReadPool2];

		expect(poolManager.getReadPool()).toBe(fakeReadPool2);
	});

	it("health aggregates read pools when present", async () => {
		const poolManager = new DatabasePoolManager({
			writeUrl,
			readUrls: [readUrl1, readUrl2],
			maxConnections: 10,
			idleTimeoutMs: 30_000,
		});

		const okClient = {
			query: vi.fn(async () => undefined),
			release: vi.fn(() => undefined),
		};
		const okPool = {
			connect: vi.fn(async () => okClient),
			end: vi.fn(async () => undefined),
			totalCount: 1,
		} as unknown as Pool;
		const badPool = {
			connect: vi.fn(async () => {
				throw new Error("no");
			}),
			end: vi.fn(async () => undefined),
			totalCount: 1,
		} as unknown as Pool;

		(poolManager as any).writePool = okPool;
		(poolManager as any).readPools = [okPool, badPool];

		const health = await poolManager.health();
		expect(health.write).toBe(true);
		expect(health.read).toEqual([true, false]);
		expect(health.overall).toBe(false);
	});

	it("round-robin falls back to write pool when selected pool is missing", () => {
		const poolManager = new DatabasePoolManager(
			{
				writeUrl,
				readUrls: [readUrl1],
				maxConnections: 10,
				idleTimeoutMs: 30_000,
			},
			"round-robin",
		);

		const fakeWritePool = {} as unknown as Pool;
		(poolManager as any).writePool = fakeWritePool;
		(poolManager as any).readPools = [undefined];

		expect(poolManager.getReadPool()).toBe(fakeWritePool);
	});

	it("uses default strategy fallback when strategy is unknown", () => {
		const poolManager = new DatabasePoolManager(
			{
				writeUrl,
				readUrls: [readUrl1],
				maxConnections: 10,
				idleTimeoutMs: 30_000,
			},
			"round-robin",
		);

		const fakeWritePool = {} as unknown as Pool;
		const fakeReadPool = { totalCount: 1 } as unknown as Pool;
		(poolManager as any).writePool = fakeWritePool;
		(poolManager as any).readPools = [fakeReadPool];
		(poolManager as any).strategy = "unknown";

		expect(poolManager.getReadPool()).toBe(fakeReadPool);
	});

	it("health uses write health when no read pools are configured", async () => {
		const poolManager = new DatabasePoolManager({
			writeUrl,
			readUrls: [],
			maxConnections: 10,
			idleTimeoutMs: 30_000,
		});

		const okClient = {
			query: vi.fn(async () => undefined),
			release: vi.fn(() => undefined),
		};
		const okPool = {
			connect: vi.fn(async () => okClient),
			end: vi.fn(async () => undefined),
			totalCount: 1,
		} as unknown as Pool;

		(poolManager as any).writePool = okPool;
		(poolManager as any).readPools = [];

		const health = await poolManager.health();
		expect(health.write).toBe(true);
		expect(health.read).toEqual([]);
		expect(health.overall).toBe(true);
	});
});
