import { describe, expect, it } from "vitest";
import { ApiClient, QnspApiError } from "./api-client.js";

describe("ApiClient", () => {
	it("constructs with required config", () => {
		const client = new ApiClient({
			baseUrl: "https://api.qnsp.cuilabs.io",
			apiKey: "test-key",
			tenantId: "test-tenant",
		});
		expect(client).toBeDefined();
	});

	it("strips trailing slash from baseUrl", () => {
		const client = new ApiClient({
			baseUrl: "https://api.qnsp.cuilabs.io/",
			apiKey: "test-key",
			tenantId: "test-tenant",
		});
		expect(client).toBeDefined();
	});
});

describe("QnspApiError", () => {
	it("captures status code and body", () => {
		const error = new QnspApiError("Not found", 404, { message: "Not found" });
		expect(error.statusCode).toBe(404);
		expect(error.body).toEqual({ message: "Not found" });
		expect(error.name).toBe("QnspApiError");
		expect(error.message).toBe("Not found");
	});
});
