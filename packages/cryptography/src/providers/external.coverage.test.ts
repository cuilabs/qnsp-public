import { beforeEach, describe, expect, it } from "vitest";

import { createTestPqcProvider } from "../testing/providers.js";
import {
	type ExternalPqcProviderFactory,
	initializeExternalPqcProvider,
	listExternalPqcProviders,
	registerExternalPqcProvider,
	unregisterExternalPqcProvider,
} from "./external.js";

describe("External PQC Provider Registry - Coverage", () => {
	beforeEach(() => {
		// Clean up any registered external providers
		const providers = listExternalPqcProviders();
		for (const provider of providers) {
			unregisterExternalPqcProvider(provider.name);
		}
	});

	describe("registerExternalPqcProvider", () => {
		it("should register external provider factory", () => {
			const factory: ExternalPqcProviderFactory = {
				metadata: {
					name: "test-external",
					version: "1.0.0",
					supportedAlgorithms: ["kyber-768", "dilithium-3"],
				},
				create: async () => createTestPqcProvider(),
			};

			registerExternalPqcProvider(factory);

			const list = listExternalPqcProviders();
			expect(list).toHaveLength(1);
			expect(list[0]?.name).toBe("test-external");
		});

		it("should register factory with all metadata fields", () => {
			const factory: ExternalPqcProviderFactory = {
				metadata: {
					name: "full-metadata",
					version: "2.0.0",
					author: "Test Author",
					homepage: "https://example.com",
					supportedAlgorithms: ["falcon-512"],
				},
				create: async () => createTestPqcProvider(),
			};

			registerExternalPqcProvider(factory);

			const list = listExternalPqcProviders();
			const registered = list.find((p) => p.name === "full-metadata");
			expect(registered?.version).toBe("2.0.0");
			expect(registered?.author).toBe("Test Author");
			expect(registered?.homepage).toBe("https://example.com");
		});

		it("should overwrite existing factory with same name", () => {
			const factory1: ExternalPqcProviderFactory = {
				metadata: {
					name: "overwrite-test",
					version: "1.0.0",
					supportedAlgorithms: ["kyber-512"],
				},
				create: async () => createTestPqcProvider(),
			};

			const factory2: ExternalPqcProviderFactory = {
				metadata: {
					name: "overwrite-test",
					version: "2.0.0",
					supportedAlgorithms: ["kyber-768"],
				},
				create: async () => createTestPqcProvider(),
			};

			registerExternalPqcProvider(factory1);
			registerExternalPqcProvider(factory2);

			const list = listExternalPqcProviders();
			expect(list).toHaveLength(1);
			expect(list[0]?.version).toBe("2.0.0");
		});
	});

	describe("unregisterExternalPqcProvider", () => {
		it("should remove registered provider", () => {
			const factory: ExternalPqcProviderFactory = {
				metadata: {
					name: "to-remove",
					supportedAlgorithms: ["kyber-768"],
				},
				create: async () => createTestPqcProvider(),
			};

			registerExternalPqcProvider(factory);
			expect(listExternalPqcProviders()).toHaveLength(1);

			unregisterExternalPqcProvider("to-remove");
			expect(listExternalPqcProviders()).toHaveLength(0);
		});

		it("should be safe to unregister non-existent provider", () => {
			expect(() => unregisterExternalPqcProvider("never-existed")).not.toThrow();
		});
	});

	describe("listExternalPqcProviders", () => {
		it("should return empty array when no providers registered", () => {
			expect(listExternalPqcProviders()).toEqual([]);
		});

		it("should return all registered provider metadata", () => {
			const factory1: ExternalPqcProviderFactory = {
				metadata: {
					name: "provider-1",
					supportedAlgorithms: ["kyber-512"],
				},
				create: async () => createTestPqcProvider(),
			};

			const factory2: ExternalPqcProviderFactory = {
				metadata: {
					name: "provider-2",
					supportedAlgorithms: ["dilithium-3"],
				},
				create: async () => createTestPqcProvider(),
			};

			registerExternalPqcProvider(factory1);
			registerExternalPqcProvider(factory2);

			const list = listExternalPqcProviders();
			expect(list).toHaveLength(2);
			expect(list.map((p) => p.name)).toContain("provider-1");
			expect(list.map((p) => p.name)).toContain("provider-2");
		});
	});

	describe("initializeExternalPqcProvider", () => {
		it("should throw error for non-existent provider", async () => {
			await expect(initializeExternalPqcProvider("non-existent")).rejects.toThrow(
				"External PQC provider 'non-existent' is not registered",
			);
		});

		it("should create provider from factory", async () => {
			const mockProvider = createTestPqcProvider();
			const factory: ExternalPqcProviderFactory = {
				metadata: {
					name: "create-test",
					supportedAlgorithms: ["kyber-768"],
				},
				create: async () => mockProvider,
			};

			registerExternalPqcProvider(factory);

			const provider = await initializeExternalPqcProvider("create-test");
			expect(provider).toBe(mockProvider);
		});

		it("should pass options to factory create method", async () => {
			let capturedOptions: any = null;

			const factory: ExternalPqcProviderFactory = {
				metadata: {
					name: "options-test",
					supportedAlgorithms: ["dilithium-3"],
				},
				create: async (options) => {
					capturedOptions = options;
					return createTestPqcProvider();
				},
			};

			registerExternalPqcProvider(factory);

			const initOptions = {
				algorithms: ["dilithium-3"] as const,
				configuration: { key: "value" },
				logger: (msg: string) => console.log(msg),
			};

			await initializeExternalPqcProvider("options-test", initOptions);

			expect(capturedOptions).toEqual(initOptions);
		});

		it("should call probe function when provided", async () => {
			let probeCalled = false;

			const factory: ExternalPqcProviderFactory = {
				metadata: {
					name: "probe-test",
					supportedAlgorithms: ["falcon-512"],
				},
				probe: async () => {
					probeCalled = true;
					return true;
				},
				create: async () => createTestPqcProvider(),
			};

			registerExternalPqcProvider(factory);

			await initializeExternalPqcProvider("probe-test");

			expect(probeCalled).toBe(true);
		});

		it("should throw error when probe fails", async () => {
			const factory: ExternalPqcProviderFactory = {
				metadata: {
					name: "probe-fail",
					supportedAlgorithms: ["kyber-1024"],
				},
				probe: async () => false,
				create: async () => createTestPqcProvider(),
			};

			registerExternalPqcProvider(factory);

			await expect(initializeExternalPqcProvider("probe-fail")).rejects.toThrow(
				"External PQC provider 'probe-fail' probe failed",
			);
		});

		it("should skip probe when not provided", async () => {
			const factory: ExternalPqcProviderFactory = {
				metadata: {
					name: "no-probe",
					supportedAlgorithms: ["sphincs-shake-128f-simple"],
				},
				create: async () => createTestPqcProvider(),
			};

			registerExternalPqcProvider(factory);

			const provider = await initializeExternalPqcProvider("no-probe");
			expect(provider).toBeDefined();
		});

		it("should work without init options", async () => {
			const factory: ExternalPqcProviderFactory = {
				metadata: {
					name: "no-options",
					supportedAlgorithms: ["kyber-768"],
				},
				create: async () => createTestPqcProvider(),
			};

			registerExternalPqcProvider(factory);

			const provider = await initializeExternalPqcProvider("no-options");
			expect(provider).toBeDefined();
		});
	});
});
