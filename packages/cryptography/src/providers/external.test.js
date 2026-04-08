import { describe, expect, it, vi } from "vitest";
import { createTestPqcProvider } from "../testing/providers.js";
import {
	initializeExternalPqcProvider,
	listExternalPqcProviders,
	registerExternalPqcProvider,
	unregisterExternalPqcProvider,
} from "./external.js";

describe("external PQC providers", () => {
	it("registers metadata and initializes providers", async () => {
		const factory = {
			metadata: {
				name: "qnsp-test-provider",
				version: "0.1.0",
				supportedAlgorithms: ["kyber-768", "dilithium-3"],
			},
			probe: vi.fn().mockResolvedValue(true),
			create: vi.fn().mockResolvedValue(createTestPqcProvider()),
		};
		registerExternalPqcProvider(factory);
		expect(listExternalPqcProviders()).toContainEqual(factory.metadata);
		const provider = await initializeExternalPqcProvider("qnsp-test-provider", {
			algorithms: ["kyber-768"],
		});
		expect(provider.name).toContain("test-pqc");
		expect(factory.create).toHaveBeenCalled();
		unregisterExternalPqcProvider("qnsp-test-provider");
		expect(listExternalPqcProviders()).toHaveLength(0);
	});
	it("throws when provider probe fails", async () => {
		const factory = {
			metadata: {
				name: "qnsp-failing-provider",
				supportedAlgorithms: ["kyber-768"],
			},
			probe: vi.fn().mockResolvedValue(false),
			create: vi.fn(),
		};
		registerExternalPqcProvider(factory);
		await expect(initializeExternalPqcProvider("qnsp-failing-provider")).rejects.toThrow(
			/probe failed/,
		);
		unregisterExternalPqcProvider("qnsp-failing-provider");
	});
});
//# sourceMappingURL=external.test.js.map
