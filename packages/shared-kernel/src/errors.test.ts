import { describe, expect, it } from "vitest";
import {
	AuthenticationError,
	AuthorizationError,
	ConfigurationError,
	ConflictError,
	createAuthenticationError,
	createAuthorizationError,
	createCryptographyError,
	createTimeoutError,
	createValidationError,
	getHttpStatusCode,
	NetworkError,
	normalizeError,
	RateLimitError,
	ResourceNotFoundError,
	SystemError,
	shouldRetry,
	TimeoutError,
	ValidationError,
	WarningError,
} from "./errors/index.js";
import { ApplicationError, DomainError, ForbiddenError, UnauthorizedError } from "./errors.js";

describe("shared-kernel/errors", () => {
	it("preserves context on application errors", () => {
		const error = new ApplicationError("boom", {
			code: "CUSTOM",
			details: { module: "test" },
		});

		expect(error.code).toBe("CUSTOM");
		expect(error.details).toEqual({ module: "test" });
	});

	it("provides specialized error codes", () => {
		expect(new DomainError("invalid state").code).toBe("DOMAIN_ERROR");
		expect(new UnauthorizedError().code).toBe("UNAUTHORIZED");
		expect(new ForbiddenError().code).toBe("FORBIDDEN");
	});

	it("normalizes unknown errors to SystemError", () => {
		const normalized = normalizeError("boom");
		expect(normalized).toBeInstanceOf(SystemError);
		expect(normalized.message).toContain("boom");
	});

	it("maps http status codes for QNSPError categories", () => {
		expect(getHttpStatusCode(new TimeoutError("t", 1, "op"))).toBe(502);
		expect(getHttpStatusCode(new RateLimitError("rl", 1, 10))).toBe(429);
		expect(getHttpStatusCode(new NetworkError("n", "http://x", "GET", 503))).toBe(502);
	});

	it("shouldRetry respects retryable errors and max attempts", () => {
		const err = new TimeoutError("t", 1, "op");
		expect(shouldRetry(err, 0, 3)).toBe(true);
		expect(shouldRetry(err, 3, 3)).toBe(false);
	});

	it("shouldRetry returns false for non-retryable errors", () => {
		expect(shouldRetry(new ValidationError("bad", "field"), 0, 3)).toBe(false);
	});

	it("QNSPError serialization includes code/category/severity and stack", () => {
		const err = new ConfigurationError("cfg", "key");
		const serialized = err.toSerializable();
		expect(serialized.code).toBe("CONFIGURATION_ERROR");
		expect(serialized.category).toBe("SYSTEM");
		expect(serialized.severity).toBe("HIGH");
		expect(serialized.stack).toBeTruthy();
	});

	it("NetworkError retryability depends on status code", () => {
		expect(new NetworkError("n", "http://x", "GET", 503).isRetryable()).toBe(true);
		expect(new NetworkError("n", "http://x", "GET", 408).isRetryable()).toBe(true);
		expect(new NetworkError("n", "http://x", "GET", 429).isRetryable()).toBe(true);
		expect(new NetworkError("n", "http://x", "GET", 404).isRetryable()).toBe(false);
		// No status should be treated as retryable
		expect(new NetworkError("n", "http://x", "GET").isRetryable()).toBe(true);
	});

	it("normalizeError returns the same instance for QNSPError", () => {
		const err = new WarningError("w");
		expect(normalizeError(err)).toBe(err);
	});

	it("normalizeError maps ValidationError name and timeout messages", () => {
		const validationNamed = new Error("bad input");
		validationNamed.name = "ValidationError";
		expect(normalizeError(validationNamed)).toBeInstanceOf(ValidationError);

		const timeoutNamed = new Error("TimeoutError");
		timeoutNamed.name = "TimeoutError";
		expect(normalizeError(timeoutNamed)).toBeInstanceOf(TimeoutError);

		const timeoutMessage = new Error("request timeout");
		expect(normalizeError(timeoutMessage)).toBeInstanceOf(TimeoutError);
	});

	it("factory helpers produce expected error types", () => {
		expect(createValidationError("f", "x", "bad")).toBeInstanceOf(ValidationError);
		expect(createAuthenticationError("bad")).toBeInstanceOf(AuthenticationError);
		expect(createAuthorizationError("r", "a")).toBeInstanceOf(AuthorizationError);
		expect(createTimeoutError("op", 1)).toBeInstanceOf(TimeoutError);
		expect(createCryptographyError("op", "why").category).toBe("SECURITY");
	});

	it("getHttpStatusCode covers USER branch variants", () => {
		expect(getHttpStatusCode(new ResourceNotFoundError("thing", "id"))).toBe(404);
		expect(getHttpStatusCode(new AuthenticationError("auth"))).toBe(401);
		expect(getHttpStatusCode(new AuthorizationError("authz", "r", "a"))).toBe(403);
		expect(getHttpStatusCode(new ConflictError("conflict"))).toBe(400);
	});
});
