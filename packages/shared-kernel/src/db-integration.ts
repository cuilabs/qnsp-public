/**
 * Database Integration Helper
 *
 * Provides a complete setup for database operations with buffering and resync
 */

import type { Pool, PoolConfig } from "pg";

import { DatabaseOperationBuffer } from "./db-buffer.js";
import { DatabaseResyncWorker, type ResyncHandler } from "./db-resync.js";
import { createDatabasePoolWithRetry } from "./db-retry.js";
import { DatabaseWrapper } from "./db-wrapper.js";

export interface DatabaseIntegrationOptions {
	readonly serviceName: string;
	readonly poolConfig: PoolConfig;
	readonly resyncHandlers: readonly ResyncHandler[];
	readonly enableBuffering?: boolean;
	readonly bufferDir?: string;
	readonly retryOptions?: {
		readonly maxRetries?: number;
		readonly initialDelayMs?: number;
		readonly maxDelayMs?: number;
	};
}

export interface DatabaseIntegration {
	readonly pool: Pool;
	readonly wrapper: DatabaseWrapper;
	readonly buffer: DatabaseOperationBuffer;
	readonly resyncWorker: DatabaseResyncWorker;
	readonly shutdown: () => Promise<void>;
}

/**
 * Create a complete database integration with buffering and resync
 */
export async function createDatabaseIntegration(
	options: DatabaseIntegrationOptions,
): Promise<DatabaseIntegration> {
	const {
		serviceName,
		poolConfig,
		resyncHandlers,
		enableBuffering = true,
		bufferDir,
		retryOptions = {},
	} = options;

	// Create database pool with retry logic
	const pool = await createDatabasePoolWithRetry(poolConfig, {
		maxRetries: retryOptions.maxRetries ?? 10,
		initialDelayMs: retryOptions.initialDelayMs ?? 500,
		maxDelayMs: retryOptions.maxDelayMs ?? 30_000,
	});

	// Initialize SQLite buffer (creates database file and schema)
	const buffer = new DatabaseOperationBuffer(serviceName, bufferDir);
	await buffer.initialize();
	console.log(`[db-integration] SQLite buffer initialized: ${serviceName}`);

	// Create resync worker
	const resyncWorker = new DatabaseResyncWorker(buffer, pool, resyncHandlers);

	// Start resync worker if buffering is enabled
	// This will automatically replay buffered operations when PostgreSQL comes back online
	if (enableBuffering) {
		resyncWorker.start(5_000); // Poll every 5 seconds
		console.log(`[db-integration] Resync worker started for: ${serviceName}`);
	}

	// Create wrapper
	const wrapper = new DatabaseWrapper({
		pool,
		buffer,
		resyncWorker,
		enableBuffering,
	});

	return {
		pool,
		wrapper,
		buffer,
		resyncWorker,
		shutdown: async () => {
			console.log(`[db-integration] Shutting down database integration: ${serviceName}`);
			resyncWorker.stop();
			await buffer.close();
			await pool.end();
		},
	};
}
