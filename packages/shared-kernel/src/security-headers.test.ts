import { describe, expect, it } from "vitest";
import {
	CLOUD_PORTAL_CSP,
	DEFAULT_PERMISSIONS_POLICY,
	installEnhancedSecurityHeaders,
	installSecurityHeaders,
} from "./security-headers.js";

interface MockRequest {
	url?: string;
}

interface MockReply {
	header: (name: string, value: string) => void;
	headers: Record<string, string>;
}

type MockHookHandler = (request: MockRequest, reply: MockReply, done: () => void) => void;

function createMockServer() {
	const hooks: Record<string, MockHookHandler[]> = {};
	return {
		addHook(name: string, handler: MockHookHandler) {
			if (!hooks[name]) {
				hooks[name] = [];
			}
			hooks[name].push(handler);
		},
		hooks,
	};
}

function createMockReply() {
	const headers: Record<string, string> = {};
	return {
		header(name: string, value: string) {
			headers[name] = value;
		},
		headers,
	};
}

const noop = () => {};

describe("installSecurityHeaders", () => {
	it("sets all required security headers on every request", () => {
		const server = createMockServer();
		installSecurityHeaders(server);

		const reply = createMockReply();
		const request = { url: "/api/test" };

		const handler = server.hooks["onRequest"]?.[0];
		expect(handler).toBeDefined();
		handler?.(request, reply, noop);

		expect(reply.headers["x-content-type-options"]).toBe("nosniff");
		expect(reply.headers["x-frame-options"]).toBe("DENY");
		expect(reply.headers["x-xss-protection"]).toBe("0");
		expect(reply.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
		expect(reply.headers["x-permitted-cross-domain-policies"]).toBe("none");
		expect(reply.headers["x-download-options"]).toBe("noopen");
	});

	it("calls done callback after setting headers", () => {
		const server = createMockServer();
		installSecurityHeaders(server);

		const reply = createMockReply();
		let doneCalled = false;
		server.hooks["onRequest"]?.[0]?.({ url: "/test" }, reply, () => {
			doneCalled = true;
		});

		expect(doneCalled).toBe(true);
	});

	it("respects custom frameOptions", () => {
		const server = createMockServer();
		installSecurityHeaders(server, { frameOptions: "SAMEORIGIN" });

		const reply = createMockReply();
		server.hooks["onRequest"]?.[0]?.({ url: "/test" }, reply, noop);

		expect(reply.headers["x-frame-options"]).toBe("SAMEORIGIN");
	});

	it("respects custom referrerPolicy", () => {
		const server = createMockServer();
		installSecurityHeaders(server, { referrerPolicy: "no-referrer" });

		const reply = createMockReply();
		server.hooks["onRequest"]?.[0]?.({ url: "/test" }, reply, noop);

		expect(reply.headers["referrer-policy"]).toBe("no-referrer");
	});

	it("skips headers for excluded paths", () => {
		const server = createMockServer();
		installSecurityHeaders(server, { excludePaths: ["/health"] });

		const reply = createMockReply();
		server.hooks["onRequest"]?.[0]?.({ url: "/health" }, reply, noop);

		expect(reply.headers["x-content-type-options"]).toBeUndefined();
		expect(reply.headers["x-frame-options"]).toBeUndefined();
	});

	it("calls done even for excluded paths", () => {
		const server = createMockServer();
		installSecurityHeaders(server, { excludePaths: ["/health"] });

		const reply = createMockReply();
		let doneCalled = false;
		server.hooks["onRequest"]?.[0]?.({ url: "/health" }, reply, () => {
			doneCalled = true;
		});

		expect(doneCalled).toBe(true);
	});

	it("applies headers to non-excluded paths when excludePaths is set", () => {
		const server = createMockServer();
		installSecurityHeaders(server, { excludePaths: ["/health"] });

		const reply = createMockReply();
		server.hooks["onRequest"]?.[0]?.({ url: "/api/data" }, reply, noop);

		expect(reply.headers["x-content-type-options"]).toBe("nosniff");
	});

	it("strips query parameters when checking excluded paths", () => {
		const server = createMockServer();
		installSecurityHeaders(server, { excludePaths: ["/health"] });

		const reply = createMockReply();
		server.hooks["onRequest"]?.[0]?.({ url: "/health?verbose=true" }, reply, noop);

		expect(reply.headers["x-content-type-options"]).toBeUndefined();
	});
});

describe("installEnhancedSecurityHeaders", () => {
	it("sets enhanced headers including permissions-policy and cache-control", () => {
		const server = createMockServer();
		installEnhancedSecurityHeaders(server);

		const reply = createMockReply();
		server.hooks["onRequest"]?.[0]?.({ url: "/api/test" }, reply, noop);

		expect(reply.headers["x-content-type-options"]).toBe("nosniff");
		expect(reply.headers["permissions-policy"]).toBe(DEFAULT_PERMISSIONS_POLICY);
		expect(reply.headers["cache-control"]).toBe("no-store");
	});

	it("sets strict-transport-security when hsts is provided", () => {
		const server = createMockServer();
		installEnhancedSecurityHeaders(server, { hsts: { maxAge: 100, includeSubDomains: false } });

		const reply = createMockReply();
		server.hooks["onRequest"]?.[0]?.({ url: "/" }, reply, noop);

		expect(reply.headers["strict-transport-security"]).toBe("max-age=100");
	});

	it("sets CSP when provided", () => {
		const server = createMockServer();
		installEnhancedSecurityHeaders(server, { csp: CLOUD_PORTAL_CSP });

		const reply = createMockReply();
		server.hooks["onRequest"]?.[0]?.({ url: "/" }, reply, noop);

		expect(reply.headers["content-security-policy"]).toBe(CLOUD_PORTAL_CSP);
	});
});
