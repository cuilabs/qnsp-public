/**
 * Database Resync Worker
 *
 * Processes buffered operations when database comes back online
 */

import type { Pool } from "pg";

import type { BufferedOperation, DatabaseOperationBuffer } from "./db-buffer.js";
import { retryDatabaseOperation } from "./db-retry.js";

export interface ResyncHandler {
	readonly operation: string;
	readonly handler: (pool: Pool, payload: unknown) => Promise<void>;
}

export interface ResyncOptions {
	readonly maxRetries?: number;
	readonly batchSize?: number;
	readonly retryDelayMs?: number;
}

const DEFAULT_RESYNC_OPTIONS: Required<ResyncOptions> = {
	maxRetries: 3,
	batchSize: 100,
	retryDelayMs: 1_000,
};

export class DatabaseResyncWorker {
	private readonly buffer: DatabaseOperationBuffer;
	private readonly pool: Pool;
	private readonly handlers: Map<string, ResyncHandler["handler"]>;
	private readonly options: Required<ResyncOptions>;
	private isRunning = false;
	private intervalId: NodeJS.Timeout | null = null;

	constructor(
		buffer: DatabaseOperationBuffer,
		pool: Pool,
		handlers: readonly ResyncHandler[],
		options: ResyncOptions = {},
	) {
		this.buffer = buffer;
		this.pool = pool;
		this.handlers = new Map(handlers.map((h) => [h.operation, h.handler]));
		this.options = { ...DEFAULT_RESYNC_OPTIONS, ...options };
	}

	/**
	 * Start the resync worker (polls for buffered operations)
	 */
	start(intervalMs = 5_000): void {
		if (this.isRunning) {
			return;
		}

		this.isRunning = true;
		this.intervalId = setInterval(() => {
			void this.processBuffer();
		}, intervalMs);

		// Process immediately
		void this.processBuffer();
	}

	/**
	 * Stop the resync worker
	 */
	stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
		this.isRunning = false;
	}

	/**
	 * Process buffered operations
	 */
	async processBuffer(): Promise<void> {
		if (this.buffer.isCurrentlyProcessing()) {
			return;
		}

		const operations = this.buffer.getOperations();
		if (operations.length === 0) {
			return;
		}

		this.buffer.setProcessing(true);

		try {
			// Check if database is available
			await retryDatabaseOperation(
				async () => {
					const client = await this.pool.connect();
					try {
						await client.query("SELECT 1");
					} finally {
						client.release();
					}
				},
				{ maxRetries: 1, initialDelayMs: 100 },
			);

			// Process operations in batches
			const batch = operations.slice(0, this.options.batchSize);
			await this.processBatch(batch);
		} catch (_error) {
			// Database still unavailable, skip this cycle
			// Log only if there are operations waiting
			if (operations.length > 0) {
				console.log(`[db-resync] Database unavailable, ${operations.length} operations buffered`);
			}
		} finally {
			this.buffer.setProcessing(false);
		}
	}

	/**
	 * Process a batch of operations
	 */
	private async processBatch(operations: readonly BufferedOperation[]): Promise<void> {
		const successful: string[] = [];
		const failed: string[] = [];

		for (const op of operations) {
			const handler = this.handlers.get(op.operation);
			if (!handler) {
				// Unknown operation, skip it
				successful.push(op.id);
				continue;
			}

			try {
				await retryDatabaseOperation(() => handler(this.pool, op.payload), {
					maxRetries: this.options.maxRetries,
					initialDelayMs: this.options.retryDelayMs,
				});
				successful.push(op.id);
			} catch (_error) {
				// Increment retry count
				await this.buffer.incrementRetries([op.id]);

				// If max retries exceeded, mark as failed
				if (op.retries >= this.options.maxRetries) {
					failed.push(op.id);
				}
			}
		}

		// Remove successful operations
		if (successful.length > 0) {
			await this.buffer.removeOperations(successful);
			console.log(`[db-resync] Replayed ${successful.length} operations successfully`);
		}

		// Remove failed operations (after max retries)
		if (failed.length > 0) {
			await this.buffer.removeOperations(failed);
			console.warn(`[db-resync] Removed ${failed.length} operations after max retries`);
		}
	}

	/**
	 * Manually trigger resync
	 */
	async resync(): Promise<void> {
		await this.processBuffer();
	}
}
