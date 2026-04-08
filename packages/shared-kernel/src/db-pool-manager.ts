/**
 * Database Pool Manager with Read Replica Support
 * Manages write pool and read replica pools for Aurora PostgreSQL
 */

import { randomInt } from "node:crypto";
import type { Pool, PoolConfig } from "pg";
import { Pool as PgPool } from "pg";

import { createDatabasePoolWithRetry, type RetryOptions } from "./db-retry.js";

export interface DatabasePoolManagerOptions {
	readonly writeUrl: string;
	readonly readUrls?: readonly string[];
	readonly maxConnections?: number;
	readonly idleTimeoutMs?: number;
	readonly connectionTimeoutMs?: number;
	/** SSL config from resolvePgSsl / resolvePgSslFromEnv. Accepts the full pg PoolConfig["ssl"] type. */
	readonly ssl?: PoolConfig["ssl"];
	readonly retryOptions?: RetryOptions;
	readonly randomIndex?: (maxExclusive: number) => number;
}

export type PoolSelectionStrategy = "round-robin" | "least-connections" | "random";

/**
 * Database pool manager with read replica support
 */
export class DatabasePoolManager {
	private readonly writePool: Pool;
	private readonly readPools: Pool[];
	private readonly strategy: PoolSelectionStrategy;
	private readonly writeUrl: string;
	private readonly readUrls: readonly string[];
	private readonly randomIndex: (maxExclusive: number) => number;
	private readonly poolOptions: {
		readonly maxConnections: number;
		readonly idleTimeoutMs: number;
		readonly connectionTimeoutMs: number;
		readonly ssl: PoolConfig["ssl"];
	};
	private roundRobinIndex = 0;

	constructor(
		options: DatabasePoolManagerOptions,
		strategy: PoolSelectionStrategy = "round-robin",
	) {
		this.strategy = strategy;
		this.writeUrl = options.writeUrl;
		this.readUrls = options.readUrls ?? [];
		this.randomIndex = options.randomIndex ?? ((maxExclusive) => randomInt(0, maxExclusive));
		this.poolOptions = {
			maxConnections: options.maxConnections ?? 20,
			idleTimeoutMs: options.idleTimeoutMs ?? 30_000,
			connectionTimeoutMs: options.connectionTimeoutMs ?? 2_000,
			ssl: options.ssl,
		};

		const writeConfig: PoolConfig = {
			connectionString: this.writeUrl,
			max: this.poolOptions.maxConnections,
			idleTimeoutMillis: this.poolOptions.idleTimeoutMs,
			connectionTimeoutMillis: this.poolOptions.connectionTimeoutMs,
			ssl: this.poolOptions.ssl,
		};

		// Create write pool (will be created asynchronously with retry)
		this.writePool = new PgPool(writeConfig);

		// Create read replica pools
		this.readPools = this.readUrls.map((url) => {
			const readConfig: PoolConfig = {
				connectionString: url,
				max: this.poolOptions.maxConnections,
				idleTimeoutMillis: this.poolOptions.idleTimeoutMs,
				connectionTimeoutMillis: this.poolOptions.connectionTimeoutMs,
				ssl: this.poolOptions.ssl,
			};
			return new PgPool(readConfig);
		});

		// Initialize pools with retry logic
		this.initializePools(options.retryOptions).catch((error) => {
			console.error("[DatabasePoolManager] Failed to initialize pools:", error);
		});
	}

	/**
	 * Initialize all pools with retry logic
	 */
	private async initializePools(retryOptions?: RetryOptions): Promise<void> {
		// Initialize write pool
		await createDatabasePoolWithRetry(
			{
				connectionString: this.writeUrl,
				max: this.poolOptions.maxConnections,
				idleTimeoutMillis: this.poolOptions.idleTimeoutMs,
				connectionTimeoutMillis: this.poolOptions.connectionTimeoutMs,
				ssl: this.poolOptions.ssl,
			},
			retryOptions,
		);

		// Initialize read pools
		for (const readUrl of this.readUrls) {
			await createDatabasePoolWithRetry(
				{
					connectionString: readUrl,
					max: this.poolOptions.maxConnections,
					idleTimeoutMillis: this.poolOptions.idleTimeoutMs,
					connectionTimeoutMillis: this.poolOptions.connectionTimeoutMs,
					ssl: this.poolOptions.ssl,
				},
				retryOptions,
			);
		}
	}

	/**
	 * Get the write pool (for INSERT, UPDATE, DELETE operations)
	 */
	getWritePool(): Pool {
		return this.writePool;
	}

	/**
	 * Get a read pool (for SELECT operations)
	 * Falls back to write pool if no read replicas are configured
	 */
	getReadPool(): Pool {
		if (this.readPools.length === 0) {
			return this.writePool;
		}

		switch (this.strategy) {
			case "round-robin": {
				const index = this.roundRobinIndex % this.readPools.length;
				const pool = this.readPools[index];
				if (!pool) {
					return this.writePool;
				}
				this.roundRobinIndex = (this.roundRobinIndex + 1) % this.readPools.length;
				return pool;
			}
			case "random": {
				const candidate = this.randomIndex(this.readPools.length);
				const index =
					Number.isInteger(candidate) && candidate >= 0 && candidate < this.readPools.length
						? candidate
						: randomInt(0, this.readPools.length);
				const pool = this.readPools[index];
				return pool ?? this.writePool;
			}
			case "least-connections": {
				// Find pool with least active connections
				let minConnections = Infinity;
				let selectedPool: Pool | null = null;

				for (const pool of this.readPools) {
					const totalCount = pool.totalCount;
					if (totalCount < minConnections) {
						minConnections = totalCount;
						selectedPool = pool;
					}
				}

				return selectedPool ?? this.writePool;
			}
			default: {
				const pool = this.readPools[0];
				return pool ?? this.writePool;
			}
		}
	}

	/**
	 * Get all pools (write + read)
	 */
	getAllPools(): readonly Pool[] {
		return [this.writePool, ...this.readPools];
	}

	/**
	 * Get health status of all pools
	 */
	async health(): Promise<{
		write: boolean;
		read: readonly boolean[];
		overall: boolean;
	}> {
		const writeHealth = await this.checkPoolHealth(this.writePool);
		const readHealth = await Promise.all(this.readPools.map((pool) => this.checkPoolHealth(pool)));

		const overall = writeHealth && readHealth.length > 0 ? readHealth.every((h) => h) : writeHealth;

		return {
			write: writeHealth,
			read: readHealth,
			overall,
		};
	}

	/**
	 * Check if a pool is healthy
	 */
	private async checkPoolHealth(pool: Pool): Promise<boolean> {
		try {
			const client = await pool.connect();
			try {
				await client.query("SELECT 1");
				return true;
			} finally {
				client.release();
			}
		} catch {
			return false;
		}
	}

	/**
	 * Shutdown all pools
	 */
	async shutdown(): Promise<void> {
		await Promise.all([this.writePool.end(), ...this.readPools.map((pool) => pool.end())]);
	}
}
