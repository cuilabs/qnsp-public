import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { installFastifyErrorHandler, mapStandardError } from "./fastify.js";
import {
	AuthenticationError,
	AuthorizationError,
	ConfigurationError,
	CryptographyError,
	NetworkError,
	ResourceNotFoundError,
	SystemError,
	TimeoutError,
	ValidationError,
} from "./index.js";

describe("errors/fastify mapStandardError", () => {
	it("returns mapped response when mapError is provided", () => {
		const response = mapStandardError(new Error("x"), {
			serviceName: "svc",
			mapError: () => ({ statusCode: 418, error: "TEAPOT", message: "hi" }),
		});
		expect(response).toEqual({ statusCode: 418, error: "TEAPOT", message: "hi" });
	});

	it("maps typed errors with statusCode/code fields", () => {
		const response = mapStandardError(
			{ statusCode: 422, code: "BAD", message: "nope" },
			{ serviceName: "svc" },
		);
		expect(response).toEqual({ statusCode: 422, error: "BAD", message: "nope" });
	});

	it("maps ZodError to INVALID_REQUEST", () => {
		let err: unknown;
		try {
			z.object({ field: z.string() }).parse({});
		} catch (e) {
			err = e;
		}
		const response = mapStandardError(err, { serviceName: "svc" });
		expect(response.statusCode).toBe(400);
		expect(response.error).toBe("INVALID_REQUEST");
	});

	it("sanitizes 5xx QNSPError messages when exposeInternalMessages is false", () => {
		const response = mapStandardError(new SystemError("secret details", "x"), {
			serviceName: "svc",
			exposeInternalMessages: false,
		});
		expect(response.statusCode).toBe(500);
		expect(response.message).toBe("Internal error");
	});

	it("includes stack in details for plain Error when exposeStack is true", () => {
		const response = mapStandardError(new Error("boom"), {
			serviceName: "svc",
			exposeStack: true,
		});
		expect(response.statusCode).toBe(500);
		expect((response.details as { stack?: unknown } | undefined)?.stack).toBeTruthy();
	});

	it("covers getHttpStatusCode branches via representative QNSPErrors", () => {
		expect(
			mapStandardError(new ValidationError("v", "field"), { serviceName: "svc" }).statusCode,
		).toBe(400);
		expect(
			mapStandardError(new AuthenticationError("auth"), { serviceName: "svc" }).statusCode,
		).toBe(401);
		expect(
			mapStandardError(new AuthorizationError("authz", "r", "a"), { serviceName: "svc" })
				.statusCode,
		).toBe(403);
		expect(
			mapStandardError(new ResourceNotFoundError("thing"), { serviceName: "svc" }).statusCode,
		).toBe(404);
		expect(
			mapStandardError(new TimeoutError("t", 1, "op"), { serviceName: "svc" }).statusCode,
		).toBe(502);
		expect(
			mapStandardError(new NetworkError("n", "http://x", "GET", 429), { serviceName: "svc" })
				.statusCode,
		).toBe(502);
		expect(
			mapStandardError(new CryptographyError("c", "op"), { serviceName: "svc" }).statusCode,
		).toBe(403);
		expect(
			mapStandardError(new ConfigurationError("cfg", "key"), { serviceName: "svc" }).statusCode,
		).toBe(500);
	});
});

describe("errors/fastify installFastifyErrorHandler", () => {
	it("logs and replies using reply.status for 5xx errors", () => {
		const log = { error: vi.fn(), warn: vi.fn() };
		let handler:
			| ((
					error: unknown,
					request: { id?: string; method?: string; url?: string },
					reply: { send: (p: unknown) => unknown },
			  ) => unknown)
			| undefined;
		const server = {
			log,
			setErrorHandler: (h: typeof handler) => {
				handler = h;
			},
		};

		installFastifyErrorHandler(server, { serviceName: "svc", exposeInternalMessages: false });

		const reply = {
			_status: 0,
			headers: {} as Record<string, string>,
			status(code: number) {
				this._status = code;
				return this;
			},
			header(name: string, value: string) {
				this.headers[name] = value;
			},
			send: vi.fn(),
		};

		handler?.(new SystemError("boom", "x"), { id: "req-1", method: "GET", url: "/" }, reply);

		expect(reply._status).toBe(500);
		expect(reply.headers["x-request-id"]).toBe("req-1");
		expect(log.error).toHaveBeenCalled();
		expect(reply.send).toHaveBeenCalledWith(
			expect.objectContaining({ statusCode: 500, message: "Internal error" }),
		);
	});

	it("logs and replies using reply.code for 4xx errors", () => {
		const log = { error: vi.fn(), warn: vi.fn() };
		let handler:
			| ((
					error: unknown,
					request: { id?: string; method?: string; url?: string },
					reply: { send: (p: unknown) => unknown },
			  ) => unknown)
			| undefined;
		const server = {
			log,
			setErrorHandler: (h: typeof handler) => {
				handler = h;
			},
		};

		installFastifyErrorHandler(server, { serviceName: "svc" });

		const reply = {
			_code: 0,
			code(code: number) {
				this._code = code;
				return this;
			},
			send: vi.fn(),
		};

		handler?.(new ValidationError("bad", "f"), { id: "req-2", method: "POST", url: "/x" }, reply);

		expect(reply._code).toBe(400);
		expect(log.warn).toHaveBeenCalled();
		// message should be preserved for 4xx
		expect(reply.send).toHaveBeenCalledWith(
			expect.objectContaining({ statusCode: 400, message: expect.stringContaining("bad") }),
		);
	});
});
