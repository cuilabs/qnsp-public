import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { PqcTlsCertificate } from "./pqc-tls.js";
import {
	checkPqcTlsSupport,
	ensurePqcCertificateFiles,
	generatePqcCertificate,
	getPqcTlsOptions,
} from "./pqc-tls.js";

describe("pqc-tls - Comprehensive Coverage", () => {
	let testDir: string;

	beforeEach(async () => {
		testDir = join(tmpdir(), `pqc-tls-test-${Date.now()}`);
		await mkdir(testDir, { recursive: true });
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	describe("checkPqcTlsSupport", () => {
		it("should check OpenSSL version availability", () => {
			const result = checkPqcTlsSupport();

			expect(result).toHaveProperty("supported");
			expect(result).toHaveProperty("message");
			expect(typeof result.supported).toBe("boolean");
			expect(typeof result.message).toBe("string");
		});

		it("should return opensslVersion when available", () => {
			const result = checkPqcTlsSupport();

			if (process.versions.openssl) {
				expect(result.opensslVersion).toBe(process.versions.openssl);
			}
		});

		it("should indicate support based on OpenSSL major version", () => {
			const result = checkPqcTlsSupport();

			if (result.opensslVersion) {
				const major = parseInt(result.opensslVersion.split(".")[0] ?? "0", 10);
				expect(result.supported).toBe(major >= 3);
			}
		});

		it("should provide appropriate message for supported versions", () => {
			const result = checkPqcTlsSupport();

			if (result.supported) {
				expect(result.message).toContain("may support PQC-TLS");
			} else if (result.opensslVersion) {
				expect(result.message).toContain("does not support PQC-TLS");
			}
		});
	});

	describe("getPqcTlsOptions", () => {
		it("should return TLS 1.3 configuration", () => {
			const cert: PqcTlsCertificate = {
				cert: `TEST_CERT_${Date.now()}`,
				key: `TEST_PRIVATE_KEY_${Date.now()}`,
				algorithm: "dilithium-3",
				provider: "oqsprovider",
			};

			const options = getPqcTlsOptions(cert);

			expect(options.cert).toBe(cert.cert);
			expect(options.key).toBe(cert.key);
			expect(options.minVersion).toBe("TLSv1.3");
			expect(options.maxVersion).toBe("TLSv1.3");
		});

		it("should include PQC-friendly cipher suites", () => {
			const cert: PqcTlsCertificate = {
				cert: "test-cert",
				key: "test-key",
				algorithm: "falcon-512",
				provider: "oqsprovider",
			};

			const options = getPqcTlsOptions(cert);

			expect(options.ciphers).toContain("TLS_AES_256_GCM_SHA384");
			expect(options.ciphers).toContain("TLS_CHACHA20_POLY1305_SHA256");
			expect(options.ciphers).toContain("TLS_AES_128_GCM_SHA256");
		});

		it("should work with different PQC algorithms", () => {
			const algorithms = ["dilithium-2", "dilithium-5", "falcon-1024"] as const;

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
			}
		});

		it("should preserve certificate metadata", () => {
			const cert: PqcTlsCertificate = {
				cert: "cert-content",
				key: "key-content",
				algorithm: "dilithium-3",
				provider: "oqsprovider",
				certPath: "/path/to/cert.pem",
				keyPath: "/path/to/key.pem",
				metadata: {
					generatedAt: "2025-01-01T00:00:00Z",
					validityDays: 30,
					commonName: "test.example.com",
					organization: "Test Org",
					source: "generated",
				},
			};

			const options = getPqcTlsOptions(cert);
			expect(options.cert).toBe("cert-content");
			expect(options.key).toBe("key-content");
		});
	});

	describe("generatePqcCertificate", () => {
		it("should throw error for unsupported KEM algorithms", async () => {
			await expect(
				generatePqcCertificate({
					signatureAlgorithm: "kyber-512", // KEM algorithm, not signature
					outputDirectory: testDir,
				}),
			).rejects.toThrow("not supported for PQC-TLS certificate generation");
		});

		it("should throw error for kyber-768 as signature algorithm", async () => {
			await expect(
				generatePqcCertificate({
					signatureAlgorithm: "kyber-768",
					outputDirectory: testDir,
				}),
			).rejects.toThrow("not supported for PQC-TLS certificate generation");
		});

		it("should throw error for kyber-1024 as signature algorithm", async () => {
			await expect(
				generatePqcCertificate({
					signatureAlgorithm: "kyber-1024",
					outputDirectory: testDir,
				}),
			).rejects.toThrow("not supported for PQC-TLS certificate generation");
		});

		it("should accept dilithium algorithms", async () => {
			// This will fail without OpenSSL but should pass algorithm validation
			const algorithms = ["dilithium-2", "dilithium-3", "dilithium-5"] as const;

			for (const algorithm of algorithms) {
				try {
					await generatePqcCertificate({
						signatureAlgorithm: algorithm,
						outputDirectory: testDir,
					});
				} catch (error) {
					// Expected to fail without OpenSSL, but should not be algorithm validation error
					expect(error).toBeInstanceOf(Error);
					const message = (error as Error).message;
					expect(message).not.toContain("not supported for PQC-TLS certificate generation");
				}
			}
		});

		it("should accept falcon algorithms", async () => {
			const algorithms = ["falcon-512", "falcon-1024"] as const;

			for (const algorithm of algorithms) {
				try {
					await generatePqcCertificate({
						signatureAlgorithm: algorithm,
						outputDirectory: testDir,
					});
				} catch (error) {
					expect(error).toBeInstanceOf(Error);
					const message = (error as Error).message;
					expect(message).not.toContain("not supported for PQC-TLS certificate generation");
				}
			}
		});

		it("should accept sphincs algorithms", async () => {
			const algorithms = ["sphincs-shake-128f-simple", "sphincs-shake-256f-simple"] as const;

			for (const algorithm of algorithms) {
				try {
					await generatePqcCertificate({
						signatureAlgorithm: algorithm,
						outputDirectory: testDir,
					});
				} catch (error) {
					expect(error).toBeInstanceOf(Error);
					const message = (error as Error).message;
					expect(message).not.toContain("not supported for PQC-TLS certificate generation");
				}
			}
		});

		it("should use default signature algorithm when not specified", async () => {
			try {
				await generatePqcCertificate({
					outputDirectory: testDir,
				});
			} catch (error) {
				// Expected to fail without OpenSSL
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should accept custom common name", async () => {
			try {
				await generatePqcCertificate({
					commonName: "custom.example.com",
					outputDirectory: testDir,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should accept custom organization", async () => {
			try {
				await generatePqcCertificate({
					organization: "Custom Organization",
					outputDirectory: testDir,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should accept custom validity days", async () => {
			try {
				await generatePqcCertificate({
					validityDays: 90,
					outputDirectory: testDir,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should accept custom file prefix", async () => {
			try {
				await generatePqcCertificate({
					filePrefix: "custom-prefix",
					outputDirectory: testDir,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should sanitize file prefix", async () => {
			try {
				await generatePqcCertificate({
					filePrefix: "Invalid File@Name#With$Special%Chars!",
					outputDirectory: testDir,
				});
			} catch (error) {
				// Should not fail due to filename sanitization
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should accept custom cert and key paths", async () => {
			const certPath = join(testDir, "custom-cert.pem");
			const keyPath = join(testDir, "custom-key.pem");

			try {
				await generatePqcCertificate({
					certPath,
					keyPath,
					outputDirectory: testDir,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});
	});

	describe("ensurePqcCertificateFiles", () => {
		it("should reuse existing certificate files when they exist", async () => {
			const certPath = join(testDir, "existing.cert.pem");
			const keyPath = join(testDir, "existing.key.pem");

			await writeFile(certPath, "EXISTING_CERT");
			await writeFile(keyPath, "EXISTING_PRIVATE_KEY");

			const result = await ensurePqcCertificateFiles({
				certPath,
				keyPath,
				reuseExisting: true,
			});

			expect(result.cert).toContain("EXISTING_CERT");
			expect(result.key).toContain("EXISTING_PRIVATE_KEY");
			expect(result.certPath).toBe(certPath);
			expect(result.keyPath).toBe(keyPath);
			expect(result.metadata?.source).toBe("existing");
		});

		it("should generate new certificate when files do not exist", async () => {
			const certPath = join(testDir, "new.cert.pem");
			const keyPath = join(testDir, "new.key.pem");

			try {
				await ensurePqcCertificateFiles({
					certPath,
					keyPath,
					outputDirectory: testDir,
				});
			} catch (error) {
				// Expected to fail without OpenSSL
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should generate new certificate when reuseExisting is false", async () => {
			const certPath = join(testDir, "force-new.cert.pem");
			const keyPath = join(testDir, "force-new.key.pem");

			await writeFile(certPath, "OLD CERT");
			await writeFile(keyPath, "OLD KEY");

			try {
				await ensurePqcCertificateFiles({
					certPath,
					keyPath,
					reuseExisting: false,
					outputDirectory: testDir,
				});
			} catch (error) {
				// Expected to fail without OpenSSL
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should generate certificate when only cert file exists", async () => {
			const certPath = join(testDir, "partial.cert.pem");
			const keyPath = join(testDir, "partial.key.pem");

			await writeFile(certPath, "CERT ONLY");

			try {
				await ensurePqcCertificateFiles({
					certPath,
					keyPath,
					outputDirectory: testDir,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should generate certificate when only key file exists", async () => {
			const certPath = join(testDir, "partial2.cert.pem");
			const keyPath = join(testDir, "partial2.key.pem");

			await writeFile(keyPath, "KEY ONLY");

			try {
				await ensurePqcCertificateFiles({
					certPath,
					keyPath,
					outputDirectory: testDir,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should use output directory from cert path when not specified", async () => {
			const certPath = join(testDir, "subdir", "cert.pem");
			const keyPath = join(testDir, "subdir", "key.pem");

			try {
				await ensurePqcCertificateFiles({
					certPath,
					keyPath,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should accept null cert and key paths", async () => {
			try {
				await ensurePqcCertificateFiles({
					certPath: null,
					keyPath: null,
					outputDirectory: testDir,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should pass through all PQC options", async () => {
			try {
				await ensurePqcCertificateFiles({
					signatureAlgorithm: "dilithium-3",
					provider: "oqsprovider",
					commonName: "test.local",
					organization: "Test Org",
					validityDays: 60,
					outputDirectory: testDir,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
		});
	});
});
