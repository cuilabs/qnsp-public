import { beforeEach, describe, expect, it } from "vitest";

import {
	getPqcProvider,
	getPqcProviderMetadata,
	listPqcProviders,
	registerPqcProvider,
	resolvePqcProvider,
	unregisterPqcProvider,
} from "./provider.js";
import { createTestPqcProvider } from "./testing/providers.js";

describe("PQC Provider Registry - Coverage Tests", () => {
	beforeEach(() => {
		// Clean up any registered providers
		const providers = listPqcProviders();
		for (const name of providers) {
			unregisterPqcProvider(name);
		}
	});

	describe("getPqcProvider", () => {
		it("should throw error when provider is not registered", () => {
			expect(() => getPqcProvider("non-existent-provider")).toThrow(
				"PQC provider 'non-existent-provider' is not registered",
			);
		});

		it("should return registered provider", () => {
			const provider = createTestPqcProvider();
			registerPqcProvider("test-provider", provider);

			const retrieved = getPqcProvider("test-provider");
			expect(retrieved).toBe(provider);
		});
	});

	describe("resolvePqcProvider", () => {
		it("should throw error when no providers are registered", () => {
			expect(() => resolvePqcProvider([])).toThrow("No PQC providers are registered");
		});

		it("should throw error when preferred providers are not registered", () => {
			const provider = createTestPqcProvider();
			registerPqcProvider("available-provider", provider);

			expect(() => resolvePqcProvider(["missing-provider-1", "missing-provider-2"])).toThrow(
				"Preferred PQC providers [missing-provider-1, missing-provider-2] are not registered",
			);
		});

		it("should skip empty strings in preference list", () => {
			const provider = createTestPqcProvider();
			registerPqcProvider("valid-provider", provider);

			const resolved = resolvePqcProvider(["", "  ", "valid-provider"]);
			expect(resolved.name).toBe("valid-provider");
			expect(resolved.provider).toBe(provider);
		});

		it("should return first available provider from preference list", () => {
			const provider1 = createTestPqcProvider();
			const provider2 = createTestPqcProvider();
			registerPqcProvider("provider-1", provider1);
			registerPqcProvider("provider-2", provider2);

			const resolved = resolvePqcProvider(["provider-2", "provider-1"]);
			expect(resolved.name).toBe("provider-2");
			expect(resolved.provider).toBe(provider2);
		});

		it("should use all registered providers when preference list is empty", () => {
			const provider = createTestPqcProvider();
			registerPqcProvider("default-provider", provider);

			const resolved = resolvePqcProvider([]);
			expect(resolved.name).toBe("default-provider");
			expect(resolved.provider).toBe(provider);
		});

		it("should include metadata in resolved provider", () => {
			const provider = createTestPqcProvider();
			const metadata = {
				version: "1.0.0",
				supportedAlgorithms: ["kyber-768", "dilithium-3"] as const,
				implementation: "test",
			};
			registerPqcProvider("metadata-provider", provider, metadata);

			const resolved = resolvePqcProvider(["metadata-provider"]);
			expect(resolved.metadata).toEqual(metadata);
			expect(resolved.registeredAt).toBeInstanceOf(Date);
		});

		it("should not include metadata when not provided", () => {
			const provider = createTestPqcProvider();
			registerPqcProvider("no-metadata-provider", provider);

			const resolved = resolvePqcProvider(["no-metadata-provider"]);
			expect(resolved.metadata).toBeUndefined();
		});
	});

	describe("getPqcProviderMetadata", () => {
		it("should return undefined for non-existent provider", () => {
			const metadata = getPqcProviderMetadata("non-existent");
			expect(metadata).toBeUndefined();
		});

		it("should return undefined when provider has no metadata", () => {
			const provider = createTestPqcProvider();
			registerPqcProvider("no-metadata", provider);

			const metadata = getPqcProviderMetadata("no-metadata");
			expect(metadata).toBeUndefined();
		});

		it("should return metadata when provider has metadata", () => {
			const provider = createTestPqcProvider();
			const expectedMetadata = {
				version: "2.0.0",
				supportedAlgorithms: ["falcon-512"] as const,
			};
			registerPqcProvider("with-metadata", provider, expectedMetadata);

			const metadata = getPqcProviderMetadata("with-metadata");
			expect(metadata).toEqual(expectedMetadata);
		});
	});

	describe("registerPqcProvider", () => {
		it("should register provider without metadata", () => {
			const provider = createTestPqcProvider();
			registerPqcProvider("simple-provider", provider);

			const retrieved = getPqcProvider("simple-provider");
			expect(retrieved).toBe(provider);
			expect(getPqcProviderMetadata("simple-provider")).toBeUndefined();
		});

		it("should register provider with metadata", () => {
			const provider = createTestPqcProvider();
			const metadata = { version: "1.0.0" };
			registerPqcProvider("provider-with-meta", provider, metadata);

			const retrieved = getPqcProvider("provider-with-meta");
			expect(retrieved).toBe(provider);
			expect(getPqcProviderMetadata("provider-with-meta")).toEqual(metadata);
		});

		it("should overwrite existing provider registration", () => {
			const provider1 = createTestPqcProvider();
			const provider2 = createTestPqcProvider();

			registerPqcProvider("overwrite-test", provider1);
			registerPqcProvider("overwrite-test", provider2);

			const retrieved = getPqcProvider("overwrite-test");
			expect(retrieved).toBe(provider2);
		});
	});

	describe("unregisterPqcProvider", () => {
		it("should remove provider from registry", () => {
			const provider = createTestPqcProvider();
			registerPqcProvider("to-remove", provider);

			expect(listPqcProviders()).toContain("to-remove");

			unregisterPqcProvider("to-remove");

			expect(listPqcProviders()).not.toContain("to-remove");
			expect(() => getPqcProvider("to-remove")).toThrow();
		});

		it("should be safe to unregister non-existent provider", () => {
			expect(() => unregisterPqcProvider("never-existed")).not.toThrow();
		});
	});

	describe("listPqcProviders", () => {
		it("should return empty array when no providers registered", () => {
			expect(listPqcProviders()).toEqual([]);
		});

		it("should return all registered provider names", () => {
			const provider1 = createTestPqcProvider();
			const provider2 = createTestPqcProvider();
			const provider3 = createTestPqcProvider();

			registerPqcProvider("provider-a", provider1);
			registerPqcProvider("provider-b", provider2);
			registerPqcProvider("provider-c", provider3);

			const list = listPqcProviders();
			expect(list).toHaveLength(3);
			expect(list).toContain("provider-a");
			expect(list).toContain("provider-b");
			expect(list).toContain("provider-c");
		});
	});
});
