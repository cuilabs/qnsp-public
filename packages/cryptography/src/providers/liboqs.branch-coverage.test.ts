import { describe, expect, it, vi } from "vitest";

import type { PqcAlgorithm } from "../provider.js";
import { createLiboqsProviderFactory } from "./liboqs.js";

describe("liboqs provider - Branch Coverage", () => {
	describe("error handling and edge cases", () => {
		it("should handle module loading failure in probe", async () => {
			const loadModule = vi.fn(async () => {
				throw new Error("Module not found");
			});

			const factory = createLiboqsProviderFactory({ loadModule });
			expect(factory.probe).toBeDefined();
			const probe = factory.probe;
			if (!probe) {
				throw new Error("probe is not defined");
			}
			await expect(probe()).rejects.toThrow("Module not found");
		});

		it("should reject when module loading fails during create", async () => {
			const loadModule = vi.fn(async () => {
				throw new Error("Failed to load native module");
			});

			const factory = createLiboqsProviderFactory({ loadModule });

			await expect(factory.create()).rejects.toThrow("Failed to load native module");
		});

		it("should reject unsupported algorithms", async () => {
			const stubModule = {
				KEM: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					encapsulate() {
						return { ciphertext: new Uint8Array(1), sharedSecret: new Uint8Array(1) };
					}
					decapsulate() {
						return new Uint8Array(1);
					}
				},
				Sig: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					sign() {
						return new Uint8Array(1);
					}
					verify() {
						return true;
					}
				},
				getSupportedKems: () => ["Kyber512"],
				getSupportedSignatures: () => ["Dilithium2"],
			};

			const loadModule = vi.fn(async () => stubModule);
			const factory = createLiboqsProviderFactory({ loadModule });

			await expect(
				factory.create({
					algorithms: ["kyber-512", "unsupported-algo" as PqcAlgorithm],
				}),
			).rejects.toThrow("not supported by the liboqs module");
		});

		it("should handle empty algorithm list by using all available", async () => {
			const stubModule = {
				KEM: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					encapsulate() {
						return { ciphertext: new Uint8Array(1), sharedSecret: new Uint8Array(1) };
					}
					decapsulate() {
						return new Uint8Array(1);
					}
				},
				Sig: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					sign() {
						return new Uint8Array(1);
					}
					verify() {
						return true;
					}
				},
				getSupportedKems: () => ["Kyber512", "Kyber768"],
				getSupportedSignatures: () => ["Dilithium2", "Dilithium3"],
			};

			const loadModule = vi.fn(async () => stubModule);
			const factory = createLiboqsProviderFactory({ loadModule });

			const provider = await factory.create({ algorithms: [] });

			expect(provider).toBeDefined();
			expect(provider.name).toBe("liboqs");
		});

		it("should handle undefined algorithms option", async () => {
			const stubModule = {
				KEM: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					encapsulate() {
						return { ciphertext: new Uint8Array(1), sharedSecret: new Uint8Array(1) };
					}
					decapsulate() {
						return new Uint8Array(1);
					}
				},
				Sig: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					sign() {
						return new Uint8Array(1);
					}
					verify() {
						return true;
					}
				},
				getSupportedKems: () => ["Kyber512"],
				getSupportedSignatures: () => ["Dilithium2"],
			};

			const loadModule = vi.fn(async () => stubModule);
			const factory = createLiboqsProviderFactory({ loadModule });

			const provider = await factory.create();

			expect(provider).toBeDefined();
		});

		it("should throw when no algorithms are available", async () => {
			const stubModule = {
				KEM: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					encapsulate() {
						return { ciphertext: new Uint8Array(1), sharedSecret: new Uint8Array(1) };
					}
					decapsulate() {
						return new Uint8Array(1);
					}
				},
				Sig: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					sign() {
						return new Uint8Array(1);
					}
					verify() {
						return true;
					}
				},
				getSupportedKems: () => [],
				getSupportedSignatures: () => [],
			};

			const loadModule = vi.fn(async () => stubModule);
			const factory = createLiboqsProviderFactory({ loadModule });

			await expect(factory.create()).rejects.toThrow(
				"No liboqs algorithms are available with the current module configuration",
			);
		});

		it("should handle module without version function", async () => {
			const stubModule = {
				KEM: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					encapsulate() {
						return { ciphertext: new Uint8Array(1), sharedSecret: new Uint8Array(1) };
					}
					decapsulate() {
						return new Uint8Array(1);
					}
				},
				Sig: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					sign() {
						return new Uint8Array(1);
					}
					verify() {
						return true;
					}
				},
				getSupportedKems: () => ["Kyber512"],
				getSupportedSignatures: () => ["Dilithium2"],
			};

			const loadModule = vi.fn(async () => stubModule);
			const factory = createLiboqsProviderFactory({ loadModule });

			const provider = await factory.create();

			expect(provider).toBeDefined();
		});

		it("should handle module without getSupportedKems", async () => {
			const stubModule = {
				KEM: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					encapsulate() {
						return { ciphertext: new Uint8Array(1), sharedSecret: new Uint8Array(1) };
					}
					decapsulate() {
						return new Uint8Array(1);
					}
				},
				Sig: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					sign() {
						return new Uint8Array(1);
					}
					verify() {
						return true;
					}
				},
				getSupportedSignatures: () => ["Dilithium2"],
			};

			const loadModule = vi.fn(async () => stubModule);
			const factory = createLiboqsProviderFactory({ loadModule });

			const provider = await factory.create({ algorithms: ["dilithium-2"] });

			expect(provider).toBeDefined();
		});

		it("should handle module without getSupportedSignatures", async () => {
			const stubModule = {
				KEM: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					encapsulate() {
						return { ciphertext: new Uint8Array(1), sharedSecret: new Uint8Array(1) };
					}
					decapsulate() {
						return new Uint8Array(1);
					}
				},
				Sig: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					sign() {
						return new Uint8Array(1);
					}
					verify() {
						return true;
					}
				},
				getSupportedKems: () => ["Kyber512"],
			};

			const loadModule = vi.fn(async () => stubModule);
			const factory = createLiboqsProviderFactory({ loadModule });

			const provider = await factory.create({ algorithms: ["kyber-512"] });

			expect(provider).toBeDefined();
		});

		it("should handle KEM instances with free method", async () => {
			let freedCount = 0;
			const stubModule = {
				KEM: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					encapsulate() {
						return { ciphertext: new Uint8Array(1), sharedSecret: new Uint8Array(1) };
					}
					decapsulate() {
						return new Uint8Array(1);
					}
					free() {
						freedCount++;
					}
				},
				Sig: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					sign() {
						return new Uint8Array(1);
					}
					verify() {
						return true;
					}
				},
				getSupportedKems: () => ["Kyber512"],
				getSupportedSignatures: () => [],
			};

			const loadModule = vi.fn(async () => stubModule);
			const factory = createLiboqsProviderFactory({ loadModule });
			const provider = await factory.create({ algorithms: ["kyber-512"] });

			await provider.generateKeyPair({ algorithm: "kyber-512" });

			expect(freedCount).toBeGreaterThan(0);
		});

		it("should handle Signature instances with free method", async () => {
			let freedCount = 0;
			const stubModule = {
				KEM: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					encapsulate() {
						return { ciphertext: new Uint8Array(1), sharedSecret: new Uint8Array(1) };
					}
					decapsulate() {
						return new Uint8Array(1);
					}
				},
				Sig: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					sign() {
						return new Uint8Array(1);
					}
					verify() {
						return true;
					}
					free() {
						freedCount++;
					}
				},
				getSupportedKems: () => [],
				getSupportedSignatures: () => ["Dilithium2"],
			};

			const loadModule = vi.fn(async () => stubModule);
			const factory = createLiboqsProviderFactory({ loadModule });
			const provider = await factory.create({ algorithms: ["dilithium-2"] });

			await provider.generateKeyPair({ algorithm: "dilithium-2" });

			expect(freedCount).toBeGreaterThan(0);
		});

		it("should handle custom moduleId in configuration", async () => {
			const stubModule = {
				KEM: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					encapsulate() {
						return { ciphertext: new Uint8Array(1), sharedSecret: new Uint8Array(1) };
					}
					decapsulate() {
						return new Uint8Array(1);
					}
				},
				Sig: class {
					constructor(public algorithm: string) {}
					generateKeypair() {
						return { publicKey: new Uint8Array(1), secretKey: new Uint8Array(1) };
					}
					sign() {
						return new Uint8Array(1);
					}
					verify() {
						return true;
					}
				},
				getSupportedKems: () => ["Kyber512"],
				getSupportedSignatures: () => [],
			};

			const loadModule = vi.fn(async (moduleId: string) => {
				expect(moduleId).toBe("custom-liboqs-module");
				return stubModule;
			});

			const factory = createLiboqsProviderFactory({ loadModule });
			const provider = await factory.create({
				configuration: { moduleId: "custom-liboqs-module" },
				algorithms: ["kyber-512"],
			});

			expect(provider).toBeDefined();
			expect(loadModule).toHaveBeenCalledWith("custom-liboqs-module");
		});
	});
});
