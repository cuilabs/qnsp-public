/**
 * Database Wrapper with Buffer Support
 *
 * Wraps database operations to buffer them when PostgreSQL is unavailable
 * and automatically resync when the database comes back online.
 */

import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

import type { DatabaseOperationBuffer } from "./db-buffer.js";
import type { DatabaseResyncWorker } from "./db-resync.js";

export interface DatabaseWrapperOptions {
	readonly pool: Pool;
	readonly buffer: DatabaseOperationBuffer;
	readonly resyncWorker: DatabaseResyncWorker;
	readonly enableBuffering?: boolean;
}

export class DatabaseWrapper {
	private readonly pool: Pool;
	private readonly buffer: DatabaseOperationBuffer;
	private readonly resyncWorker: DatabaseResyncWorker;
	private readonly enableBuffering: boolean;

	constructor(options: DatabaseWrapperOptions) {
		this.pool = options.pool;
		this.buffer = options.buffer;
		this.resyncWorker = options.resyncWorker;
		this.enableBuffering = options.enableBuffering ?? true;
	}

	/**
	 * Check if error indicates database unavailability
	 */
	private isDatabaseUnavailable(error: unknown): boolean {
		if (!(error instanceof Error)) {
			return false;
		}

		const message = error.message.toLowerCase();
		const code = (error as { code?: string }).code?.toLowerCase() ?? "";

		// Check for connection errors
		return (
			code === "econnrefused" ||
			code === "etimedout" ||
			code === "enotfound" ||
			message.includes("connection refused") ||
			message.includes("timeout") ||
			message.includes("connect econnrefused") ||
			message.includes("getaddrinfo enotfound") ||
			(message.includes("database") && message.includes("unavailable"))
		);
	}

	/**
	 * Execute a query with automatic buffering if database is unavailable
	 */
	async query<T extends QueryResultRow = QueryResultRow>(
		text: string,
		values?: unknown[],
		operationName?: string,
	): Promise<QueryResult<T>> {
		if (!this.enableBuffering) {
			return this.pool.query<T>(text, values);
		}

		try {
			return await this.pool.query<T>(text, values);
		} catch (error) {
			// Check if database is unavailable
			if (this.isDatabaseUnavailable(error)) {
				// Buffer the operation if operation name is provided
				if (operationName) {
					try {
						await this.buffer.bufferOperation(operationName, {
							type: "query",
							text,
							values: values ?? [],
						});
					} catch (bufferError) {
						// Log buffer error but don't fail the request
						console.error("[db-wrapper] Failed to buffer operation:", bufferError);
					}
				}
			}
			// Re-throw the original error
			throw error;
		}
	}

	/**
	 * Get a client from the pool
	 */
	async connect(): Promise<PoolClient> {
		return this.pool.connect();
	}

	/**
	 * Execute a transaction with automatic buffering
	 */
	async transaction<T>(
		callback: (client: PoolClient) => Promise<T>,
		operationName?: string,
	): Promise<T> {
		if (!this.enableBuffering) {
			const client = await this.pool.connect();
			try {
				await client.query("BEGIN");
				const result = await callback(client);
				await client.query("COMMIT");
				return result;
			} catch (error) {
				await client.query("ROLLBACK");
				throw error;
			} finally {
				client.release();
			}
		}

		let client: PoolClient | null = null;
		try {
			client = await this.pool.connect();
			await client.query("BEGIN");
			const result = await callback(client);
			await client.query("COMMIT");
			return result;
		} catch (error) {
			if (client) {
				try {
					await client.query("ROLLBACK");
				} catch {
					// Ignore rollback errors
				}
			}

			// Check if database is unavailable
			if (this.isDatabaseUnavailable(error)) {
				// Buffer the operation if operation name is provided
				// Note: Transactions can't be fully serialized, so we buffer metadata
				if (operationName) {
					try {
						await this.buffer.bufferOperation(operationName, {
							type: "transaction",
							// Store metadata about the transaction for manual replay
							note: "Transaction callback cannot be serialized. Manual replay required.",
							timestamp: new Date().toISOString(),
						});
					} catch (bufferError) {
						// Log buffer error but don't fail the request
						console.error("[db-wrapper] Failed to buffer transaction:", bufferError);
					}
				}
			}
			throw error;
		} finally {
			if (client) {
				client.release();
			}
		}
	}

	/**
	 * Get the underlying pool
	 */
	getPool(): Pool {
		return this.pool;
	}

	/**
	 * Get buffer statistics
	 */
	getBufferStats() {
		return this.buffer.getStats();
	}

	/**
	 * Manually trigger resync
	 */
	async resync(): Promise<void> {
		await this.resyncWorker.resync();
	}
}
