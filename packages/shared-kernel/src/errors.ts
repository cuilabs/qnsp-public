export interface ErrorContext {
	readonly cause?: unknown;
	readonly code?: string;
	readonly details?: Record<string, unknown>;
}

export class ApplicationError extends Error {
	readonly code: string;
	readonly details: Record<string, unknown> | undefined;

	constructor(message: string, context: ErrorContext = {}) {
		super(message, { cause: context.cause });
		this.name = new.target.name;
		this.code = context.code ?? "APPLICATION_ERROR";
		this.details = context.details;
	}
}

export class DomainError extends ApplicationError {
	constructor(message: string, context: ErrorContext = {}) {
		super(message, { ...context, code: context.code ?? "DOMAIN_ERROR" });
	}
}

export class UnauthorizedError extends ApplicationError {
	constructor(message = "Unauthorized", context: ErrorContext = {}) {
		super(message, { ...context, code: context.code ?? "UNAUTHORIZED" });
	}
}

export class ForbiddenError extends ApplicationError {
	constructor(message = "Forbidden", context: ErrorContext = {}) {
		super(message, { ...context, code: context.code ?? "FORBIDDEN" });
	}
}

export * from "./errors/index.js";
