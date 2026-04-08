export abstract class QNSPError extends Error {
	readonly context: Record<string, unknown> | undefined;
	abstract readonly code: string;
	abstract readonly category: "USER" | "SYSTEM" | "SECURITY" | "VALIDATION" | "NETWORK";
	abstract readonly severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

	constructor(message: string, context?: Record<string, unknown>, cause?: unknown) {
		super(message, cause !== undefined ? { cause } : undefined);
		this.context = context;
		this.name = new.target.name;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, new.target);
		}
	}

	toSerializable() {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			category: this.category,
			severity: this.severity,
			context: this.context,
			stack: this.stack,
		};
	}

	isRetryable(): boolean {
		return this.category === "NETWORK" || this.code === "TIMEOUT_ERROR";
	}

	isWarning(): boolean {
		return this.category === "USER" || this.category === "VALIDATION";
	}
}

export class ValidationError extends QNSPError {
	readonly code = "VALIDATION_ERROR";
	readonly category = "VALIDATION" as const;
	readonly severity = "LOW" as const;

	constructor(message: string, fieldName?: string, value?: unknown, cause?: Error) {
		super(message, { fieldName, value: typeof value === "string" ? "[REDACTED]" : value }, cause);
	}
}

export class AuthenticationError extends QNSPError {
	readonly code = "AUTHENTICATION_ERROR";
	readonly category = "USER" as const;
	readonly severity = "MEDIUM" as const;
}

export class AuthorizationError extends QNSPError {
	readonly code = "AUTHORIZATION_ERROR";
	readonly category = "USER" as const;
	readonly severity = "MEDIUM" as const;

	constructor(message: string, resource?: string, action?: string, cause?: Error) {
		super(message, { resource, action }, cause);
	}
}

export class NetworkError extends QNSPError {
	readonly url: string | undefined;
	readonly method: string | undefined;
	readonly status: number | undefined;

	readonly code = "NETWORK_ERROR";
	readonly category = "NETWORK" as const;
	readonly severity = "MEDIUM" as const;

	constructor(message: string, url?: string, method?: string, status?: number, cause?: Error) {
		super(message, { url, method, status }, cause);
		this.url = url;
		this.method = method;
		this.status = status;
	}

	override isRetryable(): boolean {
		return !this.status || this.status >= 500 || this.status === 408 || this.status === 429;
	}
}

export class TimeoutError extends QNSPError {
	readonly timeoutMs: number;
	readonly code = "TIMEOUT_ERROR";
	readonly category = "NETWORK" as const;
	readonly severity = "MEDIUM" as const;

	constructor(message: string, timeoutMs: number, operation?: string, cause?: Error) {
		super(message, { timeoutMs, operation }, cause);
		this.timeoutMs = timeoutMs;
	}

	override isRetryable(): boolean {
		return true;
	}
}

export class ConfigurationError extends QNSPError {
	readonly code = "CONFIGURATION_ERROR";
	readonly category = "SYSTEM" as const;
	readonly severity = "HIGH" as const;

	constructor(message: string, configKey?: string, cause?: Error) {
		super(message, { configKey }, cause);
	}
}

export class DatabaseError extends QNSPError {
	readonly operation: string | undefined;
	readonly table: string | undefined;
	readonly code = "DATABASE_ERROR";
	readonly category = "SYSTEM" as const;
	readonly severity = "HIGH" as const;

	constructor(message: string, operation?: string, table?: string, cause?: Error) {
		super(message, { operation, table }, cause);
		this.operation = operation;
		this.table = table;
	}
}

export class CryptographyError extends QNSPError {
	readonly code = "CRYPTOGRAPHY_ERROR";
	readonly category = "SECURITY" as const;
	readonly severity = "HIGH" as const;

	constructor(message: string, operation?: string, cause?: Error) {
		super(message, { operation }, cause);
	}
}

export class ResourceNotFoundError extends QNSPError {
	readonly code = "RESOURCE_NOT_FOUND";
	readonly category = "USER" as const;
	readonly severity = "LOW" as const;

	constructor(resourceType: string, identifier?: string, cause?: Error) {
		super(
			`${resourceType}${identifier ? ` with identifier ${identifier}` : ""} not found`,
			{ resourceType, identifier },
			cause,
		);
	}
}

export class ConflictError extends QNSPError {
	readonly code = "CONFLICT_ERROR";
	readonly category = "USER" as const;
	readonly severity = "LOW" as const;

	constructor(message: string, resourceType?: string, identifier?: string, cause?: Error) {
		super(message, { resourceType, identifier }, cause);
	}
}

export class RateLimitError extends QNSPError {
	readonly retryAfter: number | undefined;
	readonly limit: number | undefined;
	readonly code = "RATE_LIMIT_ERROR";
	readonly category = "NETWORK" as const;
	readonly severity = "MEDIUM" as const;

	constructor(message: string, retryAfter?: number, limit?: number, cause?: Error) {
		super(message, { retryAfter, limit }, cause);
		this.retryAfter = retryAfter;
		this.limit = limit;
	}

	override isRetryable(): boolean {
		return true;
	}
}

export class WarningError extends QNSPError {
	readonly code = "WARNING";
	readonly category = "SYSTEM" as const;
	readonly severity = "LOW" as const;

	override isWarning(): boolean {
		return true;
	}
}

export function createValidationError(
	fieldName: string,
	value: unknown,
	issue: string,
): ValidationError {
	return new ValidationError(`Invalid ${fieldName}: ${issue}`, fieldName, value);
}

export function createAuthenticationError(reason: string): AuthenticationError {
	return new AuthenticationError(`Authentication failed: ${reason}`);
}

export function createAuthorizationError(resource: string, action: string): AuthorizationError {
	return new AuthorizationError(`Not authorized to ${action} on ${resource}`, resource, action);
}

export function createNetworkError(
	response: Response & { method?: string },
	cause?: Error,
): NetworkError {
	return new NetworkError(
		`Network request failed: ${response.status} ${response.statusText}`,
		response.url,
		response.method || "GET",
		response.status,
		cause,
	);
}

export function createTimeoutError(operation: string, timeoutMs: number): TimeoutError {
	return new TimeoutError(
		`Operation ${operation} timed out after ${timeoutMs}ms`,
		timeoutMs,
		operation,
	);
}

export function createCryptographyError(operation: string, reason: string): CryptographyError {
	return new CryptographyError(`Cryptography operation ${operation} failed: ${reason}`, operation);
}

export class SystemError extends QNSPError {
	readonly code = "SYSTEM_ERROR";
	readonly category = "SYSTEM" as const;
	readonly severity = "HIGH" as const;

	constructor(message: string, component?: string, cause?: Error) {
		super(message, { component }, cause);
	}
}

export function normalizeError(error: unknown): QNSPError {
	if (error instanceof QNSPError) {
		return error;
	}
	if (error instanceof Error) {
		if (error.name === "ValidationError") {
			return new ValidationError(error.message, undefined, undefined, error);
		}
		if (error.name === "TimeoutError" || error.message.includes("timeout")) {
			return new TimeoutError(error.message, 0, undefined, error);
		}
		return new SystemError(error.message, "Unknown", error);
	}
	return new SystemError(String(error), "Unknown");
}

export function shouldRetry(error: unknown, attempt: number, maxAttempts: number): boolean {
	if (attempt >= maxAttempts) {
		return false;
	}
	const normalized = normalizeError(error);
	return normalized.isRetryable();
}

export function getHttpStatusCode(error: QNSPError): number {
	switch (error.category) {
		case "VALIDATION":
			return 400;
		case "USER":
			return error.code === "RESOURCE_NOT_FOUND"
				? 404
				: error.code === "AUTHENTICATION_ERROR"
					? 401
					: error.code === "AUTHORIZATION_ERROR"
						? 403
						: 400;
		case "NETWORK":
			return error.code === "RATE_LIMIT_ERROR" ? 429 : 502;
		case "SECURITY":
			return 403;
		default:
			return 500;
	}
}

export * from "./fastify.js";
