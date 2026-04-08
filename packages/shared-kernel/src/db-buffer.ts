/**
 * Database Operation Buffer (SQLite)
 *
 * Stores database operations when PostgreSQL is unavailable
 * and replays them when the database comes back online.
 * Uses SQLite for ACID transactions and reliable persistence.
 */

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path, { dirname } from "node:path";

import initSqlJs, { type Database as SqlJsDatabase } from "sql.js";

export interface BufferedOperation {
	readonly id: string;
	readonly service: string;
	readonly operation: string;
	readonly payload: unknown;
	readonly timestamp: string;
	retries: number;
}

export interface BufferStats {
	readonly totalOperations: number;
	readonly oldestOperation: string | null;
	readonly newestOperation: string | null;
}

const SCHEMA_STATEMENTS = [
	`CREATE TABLE IF NOT EXISTS buffered_operations (
		id TEXT PRIMARY KEY,
		service TEXT NOT NULL,
		operation TEXT NOT NULL,
		payload TEXT NOT NULL,
		timestamp TEXT NOT NULL,
		retries INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	)`,
	`CREATE INDEX IF NOT EXISTS idx_buffered_operations_service ON buffered_operations (service)`,
	`CREATE INDEX IF NOT EXISTS idx_buffered_operations_timestamp ON buffered_operations (timestamp)`,
	`CREATE INDEX IF NOT EXISTS idx_buffered_operations_retries ON buffered_operations (retries)`,
] as const;

export class DatabaseOperationBuffer {
	private readonly serviceName: string;
	private readonly dbPath: string;
	private db: SqlJsDatabase | null = null;
	private isProcessing = false;

	constructor(serviceName: string, bufferDir?: string) {
		this.serviceName = serviceName;
		const baseDir = bufferDir ?? path.join(process.cwd(), "var", "db-buffer");
		this.dbPath = path.join(baseDir, `${serviceName}.sqlite`);
	}

	/**
	 * Initialize the buffer (create SQLite database and schema)
	 */
	async initialize(): Promise<void> {
		// Ensure directory exists
		await mkdir(dirname(this.dbPath), { recursive: true });

		// Load sql.js module
		const SQL = await initSqlJs();

		// Load or create database
		try {
			const data = await readFile(this.dbPath);
			this.db = new SQL.Database(data);
		} catch {
			// Database doesn't exist, create new one
			this.db = new SQL.Database();
		}

		// Initialize schema
		for (const statement of SCHEMA_STATEMENTS) {
			try {
				this.db.run(statement);
			} catch (error) {
				// Ignore "table already exists" errors
				if (error instanceof Error && !/table.*already exists/i.test(error.message)) {
					throw error;
				}
			}
		}

		// Persist initial schema
		await this.persist();
	}

	/**
	 * Add an operation to the buffer
	 */
	async bufferOperation(operation: string, payload: unknown): Promise<string> {
		if (!this.db) {
			throw new Error("Buffer not initialized. Call initialize() first.");
		}

		const id = randomUUID();
		const timestamp = new Date().toISOString();
		const payloadJson = JSON.stringify(payload);

		this.db.run(
			`INSERT INTO buffered_operations (id, service, operation, payload, timestamp, retries)
			 VALUES (?, ?, ?, ?, ?, 0)`,
			[id, this.serviceName, operation, payloadJson, timestamp],
		);

		await this.persist();
		return id;
	}

	/**
	 * Get all buffered operations
	 */
	getOperations(): readonly BufferedOperation[] {
		if (!this.db) {
			return [];
		}

		const statement = this.db.prepare(
			`SELECT id, service, operation, payload, timestamp, retries
			 FROM buffered_operations
			 WHERE service = ?
			 ORDER BY timestamp ASC`,
		);
		statement.bind([this.serviceName]);

		const operations: BufferedOperation[] = [];

		while (statement.step()) {
			const row = statement.getAsObject() as {
				id: string;
				service: string;
				operation: string;
				payload: string;
				timestamp: string;
				retries: number;
			};
			operations.push({
				id: row.id,
				service: row.service,
				operation: row.operation,
				payload: JSON.parse(row.payload),
				timestamp: row.timestamp,
				retries: row.retries ?? 0,
			});
		}

		statement.free();
		return operations;
	}

	/**
	 * Get buffer statistics
	 */
	getStats(): BufferStats {
		if (!this.db) {
			return {
				totalOperations: 0,
				oldestOperation: null,
				newestOperation: null,
			};
		}

		const statement = this.db.prepare(
			`SELECT 
				COUNT(*) as total,
				MIN(timestamp) as oldest,
				MAX(timestamp) as newest
			 FROM buffered_operations
			 WHERE service = ?`,
		);
		statement.bind([this.serviceName]);

		if (!statement.step()) {
			statement.free();
			return {
				totalOperations: 0,
				oldestOperation: null,
				newestOperation: null,
			};
		}

		const row = statement.getAsObject() as {
			total: number;
			oldest: string | null;
			newest: string | null;
		};
		statement.free();

		return {
			totalOperations: row.total ?? 0,
			oldestOperation: row.oldest ?? null,
			newestOperation: row.newest ?? null,
		};
	}

	/**
	 * Remove operations from buffer (after successful replay)
	 */
	async removeOperations(ids: readonly string[]): Promise<void> {
		if (!this.db || ids.length === 0) {
			return;
		}

		const placeholders = ids.map(() => "?").join(",");
		this.db.run(
			`DELETE FROM buffered_operations
			 WHERE id IN (${placeholders}) AND service = ?`,
			[...ids, this.serviceName],
		);

		await this.persist();
	}

	/**
	 * Increment retry count for operations
	 */
	async incrementRetries(ids: readonly string[]): Promise<void> {
		if (!this.db || ids.length === 0) {
			return;
		}

		const placeholders = ids.map(() => "?").join(",");
		this.db.run(
			`UPDATE buffered_operations
			 SET retries = retries + 1
			 WHERE id IN (${placeholders}) AND service = ?`,
			[...ids, this.serviceName],
		);

		await this.persist();
	}

	/**
	 * Clear all operations from buffer
	 */
	async clear(): Promise<void> {
		if (!this.db) {
			return;
		}

		this.db.run(`DELETE FROM buffered_operations WHERE service = ?`, [this.serviceName]);

		await this.persist();
	}

	/**
	 * Check if buffer is processing
	 */
	isCurrentlyProcessing(): boolean {
		return this.isProcessing;
	}

	/**
	 * Set processing state
	 */
	setProcessing(processing: boolean): void {
		this.isProcessing = processing;
	}

	/**
	 * Close the database connection
	 */
	async close(): Promise<void> {
		if (this.db) {
			await this.persist();
			this.db.close();
			this.db = null;
		}
	}

	/**
	 * Persist database to disk
	 */
	private async persist(): Promise<void> {
		if (!this.db) {
			return;
		}

		const data = this.db.export();
		await writeFile(this.dbPath, Buffer.from(data));
	}
}
