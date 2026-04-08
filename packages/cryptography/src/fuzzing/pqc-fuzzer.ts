/**
 * PQC Implementation Fuzzing
 * Fuzz testing for post-quantum cryptography implementations
 */

import type { PqcAlgorithm, PqcProvider } from "../provider.js";

export interface FuzzingOptions {
	readonly algorithm: PqcAlgorithm;
	readonly iterations?: number;
	readonly maxInputSize?: number;
	readonly seed?: number;
}

export interface FuzzingResult {
	readonly algorithm: PqcAlgorithm;
	readonly iterations: number;
	readonly passed: number;
	readonly failed: number;
	readonly errors: readonly FuzzingError[];
	readonly durationMs: number;
}

export interface FuzzingError {
	readonly iteration: number;
	readonly operation: string;
	readonly error: string;
	readonly input?: unknown;
}

export class PqcFuzzer {
	constructor(private readonly provider: PqcProvider) {}

	/**
	 * Fuzz test key generation
	 */
	async fuzzKeyGeneration(options: FuzzingOptions): Promise<FuzzingResult> {
		const iterations = options.iterations ?? 1000;
		const startTime = Date.now();
		let passed = 0;
		let failed = 0;
		const errors: FuzzingError[] = [];

		for (let i = 0; i < iterations; i++) {
			try {
				const { keyPair } = await this.provider.generateKeyPair(
					options.seed === undefined
						? { algorithm: options.algorithm }
						: { algorithm: options.algorithm, seed: new Uint8Array([options.seed, i]) },
				);

				if (!keyPair.publicKey || !keyPair.privateKey) {
					throw new Error("Invalid key pair");
				}

				if (keyPair.publicKey.length === 0 || keyPair.privateKey.length === 0) {
					throw new Error("Empty key pair");
				}

				passed++;
			} catch (error) {
				failed++;
				errors.push({
					iteration: i,
					operation: "generateKeyPair",
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return {
			algorithm: options.algorithm,
			iterations,
			passed,
			failed,
			errors,
			durationMs: Date.now() - startTime,
		};
	}

	/**
	 * Fuzz test key encapsulation/decapsulation
	 */
	async fuzzKeyEncapsulation(options: FuzzingOptions): Promise<FuzzingResult> {
		const iterations = options.iterations ?? 1000;
		const startTime = Date.now();
		let passed = 0;
		let failed = 0;
		const errors: FuzzingError[] = [];

		// Generate a key pair first
		const { keyPair } = await this.provider.generateKeyPair({
			algorithm: options.algorithm,
		});

		for (let i = 0; i < iterations; i++) {
			try {
				// Encapsulate
				const encapsulation = await this.provider.encapsulate({
					algorithm: options.algorithm,
					publicKey: keyPair.publicKey,
				});

				if (!encapsulation.ciphertext || !encapsulation.sharedSecret) {
					throw new Error("Invalid encapsulation");
				}

				// Decapsulate
				const sharedSecret = await this.provider.decapsulate({
					algorithm: options.algorithm,
					privateKey: keyPair.privateKey,
					ciphertext: encapsulation.ciphertext,
				});

				// Verify shared secrets match
				if (
					sharedSecret.length !== encapsulation.sharedSecret.length ||
					!sharedSecret.every((byte, index) => byte === encapsulation.sharedSecret[index])
				) {
					throw new Error("Shared secret mismatch");
				}

				passed++;
			} catch (error) {
				failed++;
				errors.push({
					iteration: i,
					operation: "encapsulate/decapsulate",
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return {
			algorithm: options.algorithm,
			iterations,
			passed,
			failed,
			errors,
			durationMs: Date.now() - startTime,
		};
	}

	/**
	 * Fuzz test signing/verification
	 */
	async fuzzSigning(options: FuzzingOptions): Promise<FuzzingResult> {
		const iterations = options.iterations ?? 1000;
		const maxInputSize = options.maxInputSize ?? 1024;
		const startTime = Date.now();
		let passed = 0;
		let failed = 0;
		const errors: FuzzingError[] = [];

		// Generate a key pair first
		const { keyPair } = await this.provider.generateKeyPair({
			algorithm: options.algorithm,
		});

		for (let i = 0; i < iterations; i++) {
			try {
				// Generate random input data
				const sizeRand = new Uint32Array(1);
				crypto.getRandomValues(sizeRand);
				const sizeValue = sizeRand[0] ?? 0;
				const inputSize = (sizeValue % maxInputSize) + 1;
				const input = new Uint8Array(inputSize);
				crypto.getRandomValues(input);

				// Sign
				const signature = await this.provider.sign({
					algorithm: options.algorithm,
					data: input,
					privateKey: keyPair.privateKey,
				});

				if (!signature.signature || signature.signature.length === 0) {
					throw new Error("Invalid signature");
				}

				// Verify
				const verified = await this.provider.verify({
					algorithm: options.algorithm,
					data: input,
					signature: signature.signature,
					publicKey: keyPair.publicKey,
				});

				if (!verified) {
					throw new Error("Signature verification failed");
				}

				// Test with modified data (should fail)
				const modifiedInput = new Uint8Array(input);
				modifiedInput[0] = (modifiedInput[0] ?? 0) ^ 0xff;

				const verifiedModified = await this.provider.verify({
					algorithm: options.algorithm,
					data: modifiedInput,
					signature: signature.signature,
					publicKey: keyPair.publicKey,
				});

				if (verifiedModified) {
					throw new Error("Signature verification should have failed for modified data");
				}

				passed++;
			} catch (error) {
				failed++;
				errors.push({
					iteration: i,
					operation: "sign/verify",
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return {
			algorithm: options.algorithm,
			iterations,
			passed,
			failed,
			errors,
			durationMs: Date.now() - startTime,
		};
	}

	/**
	 * Fuzz test with malformed inputs
	 */
	async fuzzMalformedInputs(options: FuzzingOptions): Promise<FuzzingResult> {
		const iterations = options.iterations ?? 100;
		const startTime = Date.now();
		let passed = 0;
		let failed = 0;
		const errors: FuzzingError[] = [];

		// Generate a key pair first
		const { keyPair } = await this.provider.generateKeyPair({
			algorithm: options.algorithm,
		});

		const malformedInputs = [
			new Uint8Array(0), // Empty
			new Uint8Array(1), // Single byte
			new Uint8Array(1024).fill(0), // All zeros
			new Uint8Array(1024).fill(0xff), // All ones
			new Uint8Array(1024 * 1024), // Large input
		];

		for (let i = 0; i < iterations; i++) {
			const input = malformedInputs[i % malformedInputs.length] ?? new Uint8Array(0);
			try {
				// Try to sign with malformed input
				await this.provider.sign({
					algorithm: options.algorithm,
					data: input,
					privateKey: keyPair.privateKey,
				});

				// If we get here, the input was accepted (which is fine)
				passed++;
			} catch (error) {
				// Errors are expected for malformed inputs
				// We count them as passed if they're handled gracefully
				if (error instanceof Error && error.message.includes("Invalid")) {
					passed++;
				} else {
					failed++;
					errors.push({
						iteration: i,
						operation: "sign (malformed input)",
						error: error instanceof Error ? error.message : String(error),
						input: Array.from(input.slice(0, 16)), // First 16 bytes for debugging
					});
				}
			}
		}

		return {
			algorithm: options.algorithm,
			iterations,
			passed,
			failed,
			errors,
			durationMs: Date.now() - startTime,
		};
	}

	/**
	 * Run all fuzzing tests
	 */
	async runAllTests(options: FuzzingOptions): Promise<{
		keyGeneration: FuzzingResult;
		keyEncapsulation: FuzzingResult;
		signing: FuzzingResult;
		malformedInputs: FuzzingResult;
	}> {
		const keyGeneration = await this.fuzzKeyGeneration(options);
		const keyEncapsulation = await this.fuzzKeyEncapsulation(options);
		const signing = await this.fuzzSigning(options);
		const malformedInputs = await this.fuzzMalformedInputs(options);

		return {
			keyGeneration,
			keyEncapsulation,
			signing,
			malformedInputs,
		};
	}
}
