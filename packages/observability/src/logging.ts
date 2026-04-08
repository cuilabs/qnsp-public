import type { FastifyBaseLogger } from "fastify";
import type { RequestContextValue } from "./context.js";
import { enrichLogMetadata } from "./integrity.js";

export interface IntegrityLogOptions {
	readonly sourceService?: string;
	readonly requestContext?: RequestContextValue;
	readonly pqc?: {
		readonly algorithm?: string;
		readonly keyId?: string;
		readonly provider?: string;
	};
}

/**
 * Creates a logger wrapper that automatically enriches log metadata with provenance and PQC signature fields.
 */
export function createIntegrityLogger(
	logger: FastifyBaseLogger,
	options?: IntegrityLogOptions,
): FastifyBaseLogger {
	return {
		...logger,
		info: (obj: unknown, msg?: string, ...args: unknown[]) => {
			const enriched = enrichLogMetadata(
				typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : {},
				options,
			);
			return logger.info(enriched, msg, ...args);
		},
		error: (obj: unknown, msg?: string, ...args: unknown[]) => {
			const enriched = enrichLogMetadata(
				typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : {},
				options,
			);
			return logger.error(enriched, msg, ...args);
		},
		warn: (obj: unknown, msg?: string, ...args: unknown[]) => {
			const enriched = enrichLogMetadata(
				typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : {},
				options,
			);
			return logger.warn(enriched, msg, ...args);
		},
		debug: (obj: unknown, msg?: string, ...args: unknown[]) => {
			const enriched = enrichLogMetadata(
				typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : {},
				options,
			);
			return logger.debug(enriched, msg, ...args);
		},
		trace: (obj: unknown, msg?: string, ...args: unknown[]) => {
			const enriched = enrichLogMetadata(
				typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : {},
				options,
			);
			return logger.trace(enriched, msg, ...args);
		},
		fatal: (obj: unknown, msg?: string, ...args: unknown[]) => {
			const enriched = enrichLogMetadata(
				typeof obj === "object" && obj !== null ? (obj as Record<string, unknown>) : {},
				options,
			);
			return logger.fatal(enriched, msg, ...args);
		},
		child: (bindings: Record<string, unknown>) => {
			return createIntegrityLogger(logger.child(bindings), options);
		},
	};
}
