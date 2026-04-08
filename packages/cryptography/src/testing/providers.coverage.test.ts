import { describe, expect, it } from "vitest";

import { createDeterministicTestPqcProvider, createTestPqcProvider } from "./providers.js";

describe("Test PQC Providers - Coverage", () => {
	describe("createTestPqcProvider", () => {
		it("should create provider with test-pqc name", () => {
			const provider = createTestPqcProvider();
			expect(provider.name).toContain("test-pqc");
		});

		it("should generate key pairs for all KEM algorithms", async () => {
			const provider = createTestPqcProvider();
			const kemAlgorithms = ["kyber-512", "kyber-768", "kyber-1024"] as const;

			for (const algorithm of kemAlgorithms) {
				const { keyPair } = await provider.generateKeyPair({ algorithm });
				expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
				expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
				expect(keyPair.algorithm).toBe(algorithm);
			}
		});

		it("should generate key pairs for all signature algorithms", async () => {
			const provider = createTestPqcProvider();
			const sigAlgorithms = [
				"dilithium-2",
				"dilithium-3",
				"dilithium-5",
				"falcon-512",
				"falcon-1024",
				"sphincs-shake-128f-simple",
				"sphincs-shake-256f-simple",
			] as const;

			for (const algorithm of sigAlgorithms) {
				const { keyPair } = await provider.generateKeyPair({ algorithm });
				expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
				expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
				expect(keyPair.algorithm).toBe(algorithm);
			}
		});

		it("should support encapsulation and decapsulation", async () => {
			const provider = createTestPqcProvider();
			const { keyPair } = await provider.generateKeyPair({ algorithm: "kyber-768" });

			const { ciphertext, sharedSecret } = await provider.encapsulate({
				algorithm: "kyber-768",
				publicKey: keyPair.publicKey,
			});

			expect(ciphertext).toBeInstanceOf(Uint8Array);
			expect(sharedSecret).toBeInstanceOf(Uint8Array);

			const decapsulated = await provider.decapsulate({
				algorithm: "kyber-768",
				privateKey: keyPair.privateKey,
				ciphertext,
			});

			expect(decapsulated).toBeInstanceOf(Uint8Array);
			expect(decapsulated.length).toBeGreaterThan(0);
		});

		it("should support signing and verification", async () => {
			const provider = createTestPqcProvider();
			const { keyPair } = await provider.generateKeyPair({ algorithm: "dilithium-3" });
			const message = new TextEncoder().encode("test message");

			const { signature, algorithm } = await provider.sign({
				algorithm: "dilithium-3",
				data: message,
				privateKey: keyPair.privateKey,
			});

			expect(signature).toBeInstanceOf(Uint8Array);
			expect(algorithm).toBe("dilithium-3");

			const isValid = await provider.verify({
				algorithm: "dilithium-3",
				data: message,
				signature,
				publicKey: keyPair.publicKey,
			});

			expect(isValid).toBe(true);
		});

		it("should support hashing with default algorithm", async () => {
			const provider = createTestPqcProvider();
			const data = new TextEncoder().encode("hash this");

			const { digest, algorithm } = await provider.hash(data);

			expect(digest).toBeInstanceOf(Uint8Array);
			expect(digest.length).toBeGreaterThan(0);
			expect(algorithm).toBe("sha3-256");
		});

		it("should support hashing with custom algorithm", async () => {
			const provider = createTestPqcProvider();
			const data = new TextEncoder().encode("hash this");

			const { digest, algorithm } = await provider.hash(data, "sha256");

			expect(digest).toBeInstanceOf(Uint8Array);
			expect(algorithm).toBe("sha256");
		});

		it("should generate different keys on each call", async () => {
			const provider = createTestPqcProvider();

			const { keyPair: keyPair1 } = await provider.generateKeyPair({ algorithm: "kyber-768" });
			const { keyPair: keyPair2 } = await provider.generateKeyPair({ algorithm: "kyber-768" });

			expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey);
			expect(keyPair1.privateKey).not.toEqual(keyPair2.privateKey);
		});
	});

	describe("createDeterministicTestPqcProvider", () => {
		it("should create provider with deterministic name", () => {
			const provider = createDeterministicTestPqcProvider({ seed: "test-seed" });
			expect(provider.name).toContain("deterministic");
		});

		it("should generate same keys with same seed", async () => {
			const seed = "consistent-seed";
			const provider1 = createDeterministicTestPqcProvider({ seed });
			const provider2 = createDeterministicTestPqcProvider({ seed });

			const { keyPair: keyPair1 } = await provider1.generateKeyPair({ algorithm: "kyber-768" });
			const { keyPair: keyPair2 } = await provider2.generateKeyPair({ algorithm: "kyber-768" });

			expect(keyPair1.publicKey).toEqual(keyPair2.publicKey);
			expect(keyPair1.privateKey).toEqual(keyPair2.privateKey);
		});

		it("should generate different keys with different seeds", async () => {
			const provider1 = createDeterministicTestPqcProvider({ seed: "seed-1" });
			const provider2 = createDeterministicTestPqcProvider({ seed: "seed-2" });

			const { keyPair: keyPair1 } = await provider1.generateKeyPair({ algorithm: "kyber-768" });
			const { keyPair: keyPair2 } = await provider2.generateKeyPair({ algorithm: "kyber-768" });

			expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey);
			expect(keyPair1.privateKey).not.toEqual(keyPair2.privateKey);
		});

		it("should generate deterministic signatures", async () => {
			const seed = "sig-seed";
			const provider1 = createDeterministicTestPqcProvider({ seed });
			const provider2 = createDeterministicTestPqcProvider({ seed });

			const { keyPair: keyPair1 } = await provider1.generateKeyPair({ algorithm: "dilithium-3" });
			const { keyPair: keyPair2 } = await provider2.generateKeyPair({ algorithm: "dilithium-3" });

			const message = new TextEncoder().encode("deterministic message");

			const { signature: sig1 } = await provider1.sign({
				algorithm: "dilithium-3",
				data: message,
				privateKey: keyPair1.privateKey,
			});

			const { signature: sig2 } = await provider2.sign({
				algorithm: "dilithium-3",
				data: message,
				privateKey: keyPair2.privateKey,
			});

			expect(sig1).toEqual(sig2);
		});

		it("should support all KEM algorithms deterministically", async () => {
			const seed = "kem-seed";
			const kemAlgorithms = ["kyber-512", "kyber-768", "kyber-1024"] as const;

			for (const algorithm of kemAlgorithms) {
				const provider1 = createDeterministicTestPqcProvider({ seed });
				const provider2 = createDeterministicTestPqcProvider({ seed });

				const { keyPair: kp1 } = await provider1.generateKeyPair({ algorithm });
				const { keyPair: kp2 } = await provider2.generateKeyPair({ algorithm });

				expect(kp1.publicKey).toEqual(kp2.publicKey);
			}
		});

		it("should support all signature algorithms deterministically", async () => {
			const seed = "sig-algo-seed";
			const sigAlgorithms = [
				"dilithium-2",
				"dilithium-3",
				"dilithium-5",
				"falcon-512",
				"falcon-1024",
			] as const;

			for (const algorithm of sigAlgorithms) {
				const provider1 = createDeterministicTestPqcProvider({ seed });
				const provider2 = createDeterministicTestPqcProvider({ seed });

				const { keyPair: kp1 } = await provider1.generateKeyPair({ algorithm });
				const { keyPair: kp2 } = await provider2.generateKeyPair({ algorithm });

				expect(kp1.publicKey).toEqual(kp2.publicKey);
			}
		});

		it("should produce deterministic encapsulation", async () => {
			const seed = "encap-seed";
			const provider1 = createDeterministicTestPqcProvider({ seed });
			const provider2 = createDeterministicTestPqcProvider({ seed });

			const { keyPair } = await provider1.generateKeyPair({ algorithm: "kyber-768" });

			const { ciphertext: ct1, sharedSecret: ss1 } = await provider1.encapsulate({
				algorithm: "kyber-768",
				publicKey: keyPair.publicKey,
			});

			const { ciphertext: ct2, sharedSecret: ss2 } = await provider2.encapsulate({
				algorithm: "kyber-768",
				publicKey: keyPair.publicKey,
			});

			expect(ct1).toEqual(ct2);
			expect(ss1).toEqual(ss2);
		});

		it("should produce deterministic hashes", async () => {
			const seed = "hash-seed";
			const provider1 = createDeterministicTestPqcProvider({ seed });
			const provider2 = createDeterministicTestPqcProvider({ seed });

			const data = new TextEncoder().encode("hash data");

			const { digest: d1 } = await provider1.hash(data);
			const { digest: d2 } = await provider2.hash(data);

			expect(d1).toEqual(d2);
		});

		it("should verify signatures across deterministic providers", async () => {
			const seed = "verify-seed";
			const provider1 = createDeterministicTestPqcProvider({ seed });
			const provider2 = createDeterministicTestPqcProvider({ seed });

			const { keyPair } = await provider1.generateKeyPair({ algorithm: "falcon-512" });
			const message = new TextEncoder().encode("cross-verify");

			const { signature } = await provider1.sign({
				algorithm: "falcon-512",
				data: message,
				privateKey: keyPair.privateKey,
			});

			const isValid = await provider2.verify({
				algorithm: "falcon-512",
				data: message,
				signature,
				publicKey: keyPair.publicKey,
			});

			expect(isValid).toBe(true);
		});
	});
});
