import { describe, expect, it } from "vitest";
import { type RequestContextValue, withRequestContext } from "./context.js";
import {
	enrichLogMetadata,
	enrichMetricAttributes,
	extractProvenanceAttributes,
} from "./integrity.js";

describe("observability integrity", () => {
	it("extracts provenance attributes with source service", () => {
		const attributes = extractProvenanceAttributes("test-service");

		expect(attributes["provenance.source_service"]).toBe("test-service");
		// Trace/span IDs may or may not be present depending on active OpenTelemetry context
	});

	it("extracts provenance attributes from request context", () => {
		const requestContext: RequestContextValue = {
			requestId: "req-123",
			tenantId: "tenant-456",
			userId: "user-789",
		};

		withRequestContext(requestContext, () => {
			const attributes = extractProvenanceAttributes("test-service");

			expect(attributes["provenance.request_id"]).toBe("req-123");
			expect(attributes["provenance.tenant_id"]).toBe("tenant-456");
			expect(attributes["provenance.user_id"]).toBe("user-789");
			expect(attributes["provenance.source_service"]).toBe("test-service");
		});
	});

	it("enriches metric attributes with provenance and PQC fields", () => {
		const requestContext: RequestContextValue = {
			requestId: "req-123",
			tenantId: "tenant-456",
		};

		withRequestContext(requestContext, () => {
			const enriched = enrichMetricAttributes(
				{ existing: "value" },
				{
					sourceService: "test-service",
					requestContext,
					pqc: {
						algorithm: "dilithium-2",
						keyId: "key-1",
						provider: "liboqs",
					},
				},
			);

			expect(enriched["existing"]).toBe("value");
			expect(enriched["provenance.request_id"]).toBe("req-123");
			expect(enriched["provenance.tenant_id"]).toBe("tenant-456");
			expect(enriched["provenance.source_service"]).toBe("test-service");
			expect(enriched["pqc.algorithm"]).toBe("dilithium-2");
			expect(enriched["pqc.key_id"]).toBe("key-1");
			expect(enriched["pqc.provider"]).toBe("liboqs");
		});
	});

	it("enriches log metadata with provenance and PQC fields", () => {
		const requestContext: RequestContextValue = {
			requestId: "req-123",
			tenantId: "tenant-456",
		};

		withRequestContext(requestContext, () => {
			const enriched = enrichLogMetadata(
				{ existing: "value" },
				{
					sourceService: "test-service",
					requestContext,
					pqc: {
						algorithm: "dilithium-2",
						provider: "liboqs",
					},
				},
			);

			expect(enriched["existing"]).toBe("value");
			expect(enriched["provenance"]).toBeDefined();
			expect((enriched["provenance"] as { requestId?: string })?.requestId).toBe("req-123");
			expect((enriched["provenance"] as { tenantId?: string })?.tenantId).toBe("tenant-456");
			expect((enriched["provenance"] as { sourceService?: string })?.sourceService).toBe(
				"test-service",
			);
			expect(enriched["pqc"]).toBeDefined();
			expect((enriched["pqc"] as Record<string, unknown>)?.["pqc.algorithm"]).toBe("dilithium-2");
			expect((enriched["pqc"] as Record<string, unknown>)?.["pqc.provider"]).toBe("liboqs");
		});
	});

	it("handles missing context gracefully", () => {
		const enriched = enrichMetricAttributes(
			{ existing: "value" },
			{
				sourceService: "test-service",
			},
		);

		expect(enriched["existing"]).toBe("value");
		expect(enriched["provenance.source_service"]).toBe("test-service");
		// Other provenance fields may or may not be present depending on active context
	});
});
