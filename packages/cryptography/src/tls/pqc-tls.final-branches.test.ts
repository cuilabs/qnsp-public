import { describe, expect, it } from "vitest";
import type { PqcTlsCertificate } from "./pqc-tls.js";
import { checkPqcTlsSupport, getPqcTlsOptions } from "./pqc-tls.js";

describe("pqc-tls - Final Branch Coverage", () => {
	describe("checkPqcTlsSupport - all branches", () => {
		it("should handle OpenSSL version check", () => {
			const result = checkPqcTlsSupport();

			if (result.opensslVersion) {
				const parts = result.opensslVersion.split(".");
				const major = parseInt(parts[0] ?? "0", 10);

				if (major >= 3) {
					expect(result.supported).toBe(true);
					expect(result.message).toContain("may support PQC-TLS");
				} else {
					expect(result.supported).toBe(false);
					expect(result.message).toContain("does not support PQC-TLS");
				}
			} else {
				expect(result.supported).toBe(false);
				expect(result.message).toContain("not available");
			}
		});
	});

	describe("getPqcTlsOptions - all certificate types", () => {
		it("should handle certificate with all metadata fields", () => {
			const cert: PqcTlsCertificate = {
				cert: `FULL_CERT_${Date.now()}`,
				key: `FULL_PRIVATE_KEY_${Date.now()}`,
				algorithm: "dilithium-3",
				provider: "oqsprovider",
				certPath: "/path/to/cert.pem",
				keyPath: "/path/to/key.pem",
				metadata: {
					generatedAt: "2025-01-01T00:00:00Z",
					validityDays: 90,
					commonName: "full.example.com",
					organization: "Full Org",
					source: "generated",
				},
			};

			const options = getPqcTlsOptions(cert);

			expect(options.cert).toBe(cert.cert);
			expect(options.key).toBe(cert.key);
			expect(options.minVersion).toBe("TLSv1.3");
			expect(options.maxVersion).toBe("TLSv1.3");
			expect(options.ciphers).toContain("TLS_AES_256_GCM_SHA384");
		});

		it("should handle certificate without paths", () => {
			const cert: PqcTlsCertificate = {
				cert: "cert-content",
				key: "key-content",
				algorithm: "falcon-512",
				provider: "oqsprovider",
			};

			const options = getPqcTlsOptions(cert);

			expect(options.cert).toBe("cert-content");
			expect(options.key).toBe("key-content");
		});

		it("should handle certificate without metadata", () => {
			const cert: PqcTlsCertificate = {
				cert: "minimal-cert",
				key: "minimal-key",
				algorithm: "sphincs-shake-128f-simple",
				provider: "oqsprovider",
			};

			const options = getPqcTlsOptions(cert);

			expect(options.minVersion).toBe("TLSv1.3");
			expect(options.maxVersion).toBe("TLSv1.3");
		});

		it("should handle all supported PQC algorithms", () => {
			const algorithms = [
				"dilithium-2",
				"dilithium-3",
				"dilithium-5",
				"falcon-512",
				"falcon-1024",
				"sphincs-shake-128f-simple",
				"sphincs-shake-256f-simple",
			] as const;

			for (const algorithm of algorithms) {
				const cert: PqcTlsCertificate = {
					cert: `cert-${algorithm}`,
					key: `key-${algorithm}`,
					algorithm,
					provider: "oqsprovider",
				};

				const options = getPqcTlsOptions(cert);

				expect(options.minVersion).toBe("TLSv1.3");
				expect(options.maxVersion).toBe("TLSv1.3");
				expect(options.ciphers).toBeDefined();
			}
		});

		it("should handle certificate with existing source", () => {
			const cert: PqcTlsCertificate = {
				cert: "existing-cert",
				key: "existing-key",
				algorithm: "dilithium-3",
				provider: "oqsprovider",
				metadata: {
					generatedAt: "2024-01-01T00:00:00Z",
					validityDays: 30,
					commonName: "existing.local",
					organization: "Existing Org",
					source: "existing",
				},
			};

			const options = getPqcTlsOptions(cert);

			expect(options.cert).toBe("existing-cert");
			expect(options.key).toBe("existing-key");
		});

		it("should handle certificate with custom validity days", () => {
			const validityOptions = [7, 30, 90, 365, 730];

			for (const days of validityOptions) {
				const cert: PqcTlsCertificate = {
					cert: "cert",
					key: "key",
					algorithm: "dilithium-3",
					provider: "oqsprovider",
					metadata: {
						generatedAt: new Date().toISOString(),
						validityDays: days,
						commonName: "test.local",
						organization: "Test",
						source: "generated",
					},
				};

				const options = getPqcTlsOptions(cert);
				expect(options).toBeDefined();
			}
		});

		it("should handle certificate with different providers", () => {
			const providers = ["oqsprovider", "custom-provider", "test-provider"];

			for (const provider of providers) {
				const cert: PqcTlsCertificate = {
					cert: "cert",
					key: "key",
					algorithm: "dilithium-3",
					provider,
				};

				const options = getPqcTlsOptions(cert);
				expect(options.minVersion).toBe("TLSv1.3");
			}
		});
	});
});
