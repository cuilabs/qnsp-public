/**
 * Database Connection Retry Utility
 *
 * Provides retry logic with exponential backoff for database connections
 * to handle transient PostgreSQL connection issues.
 */

import type { Pool, PoolConfig } from "pg";
import { Pool as PgPool } from "pg";

export interface RetryOptions {
	readonly maxRetries?: number;
	readonly initialDelayMs?: number;
	readonly maxDelayMs?: number;
	readonly backoffMultiplier?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
	maxRetries: 10,
	initialDelayMs: 500,
	maxDelayMs: 30_000,
	backoffMultiplier: 2,
};

/**
 * Retry a database operation with exponential backoff
 */
export async function retryDatabaseOperation<T>(
	operation: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
	let lastError: Error | unknown;

	for (let attempt = 0; attempt <= opts.maxRetries; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			// Don't retry on last attempt
			if (attempt === opts.maxRetries) {
				break;
			}

			// Calculate delay with exponential backoff
			const delayMs = Math.min(
				opts.initialDelayMs * opts.backoffMultiplier ** attempt,
				opts.maxDelayMs,
			);

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}

	throw lastError;
}

/**
 * Create a database pool with retry logic
 */
export async function createDatabasePoolWithRetry(
	config: PoolConfig,
	options: RetryOptions = {},
): Promise<Pool> {
	return retryDatabaseOperation(async () => {
		const pool = new PgPool(config);

		// Test connection by running a simple query
		const client = await pool.connect();
		try {
			await client.query("SELECT 1");
		} finally {
			client.release();
		}

		return pool;
	}, options);
}

/**
 * Wait for PostgreSQL to become available
 */
export async function waitForPostgres(
	connectionString: string,
	options: RetryOptions = {},
): Promise<void> {
	await retryDatabaseOperation(async () => {
		const pool = new PgPool({ connectionString });
		const client = await pool.connect();
		try {
			await client.query("SELECT 1");
		} finally {
			client.release();
			await pool.end();
		}
	}, options);
}
