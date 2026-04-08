import { createHash, randomBytes, randomUUID } from "node:crypto";

import type {
	DecapsulateOptions,
	EncapsulateOptions,
	EncapsulationResult,
	GenerateKeyPairOptions,
	HashResult,
	PqcAlgorithm,
	PqcKeyPair,
	PqcProvider,
	SignatureResult,
	SignOptions,
	VerifyOptions,
} from "../provider.js";

export type RandomSource = (length: number) => Uint8Array;

const DEFAULT_SEED_LENGTH = 48;
const DEFAULT_CIPHERTEXT_LENGTH = 64;
const DEFAULT_SHARED_SECRET_LENGTH = 32;

interface KemState {
	readonly encapsulations: Map<string, Uint8Array>;
	counter: number;
}

function createKemState(): KemState {
	return {
		encapsulations: new Map<string, Uint8Array>(),
		counter: 0,
	};
}

function toHex(data: Uint8Array): string {
	return Buffer.from(data).toString("hex");
}

export function createTestPqcProvider(
	randomSource: RandomSource = (length) => randomBytes(length),
): PqcProvider {
	const kemState = createKemState();

	return {
		name: `test-pqc-${randomUUID()}`,
		async generateKeyPair({ algorithm }: GenerateKeyPairOptions) {
			const seed = randomSource(DEFAULT_SEED_LENGTH);
			return {
				keyPair: {
					algorithm,
					publicKey: seed,
					privateKey: seed,
				},
			} satisfies { keyPair: PqcKeyPair };
		},
		async encapsulate({ algorithm, publicKey }: EncapsulateOptions) {
			kemState.counter += 1;
			const ciphertext = randomSource(DEFAULT_CIPHERTEXT_LENGTH);
			const sharedSecret = randomSource(DEFAULT_SHARED_SECRET_LENGTH);
			const ciphertextKey = `${algorithm}:${toHex(ciphertext)}`;
			kemState.encapsulations.set(ciphertextKey, sharedSecret);
			return {
				ciphertext,
				sharedSecret,
				algorithm,
				publicKey,
			} satisfies EncapsulationResult & { algorithm: PqcAlgorithm; publicKey: Uint8Array };
		},
		async decapsulate({ algorithm, ciphertext }: DecapsulateOptions) {
			const ciphertextKey = `${algorithm}:${toHex(ciphertext)}`;
			const stored = kemState.encapsulations.get(ciphertextKey);
			if (!stored) {
				throw new Error(`Unknown ciphertext for algorithm '${algorithm}'`);
			}
			return stored;
		},
		async sign({ data, algorithm }: SignOptions) {
			const digest = createHash("sha256").update(algorithm).update(data).digest();
			return {
				signature: digest.subarray(0, 64),
				algorithm,
			} satisfies SignatureResult;
		},
		async verify({ data, signature, algorithm }: VerifyOptions) {
			const digest = createHash("sha256").update(algorithm).update(data).digest().subarray(0, 64);
			return Buffer.compare(digest, signature) === 0;
		},
		async hash(data: Uint8Array, algorithm = "sha3-256") {
			const digest = createHash(algorithm).update(data).digest();
			return { digest, algorithm } satisfies HashResult;
		},
	} satisfies PqcProvider;
}

function deriveBytes(seed: Uint8Array, label: string, length: number): Uint8Array {
	const blocks: Uint8Array[] = [];
	let counter = 0;

	while (blocks.reduce((total, block) => total + block.length, 0) < length) {
		const block = createHash("sha512")
			.update(seed)
			.update(label)
			.update(counter.toString(10))
			.digest();
		blocks.push(block);
		counter += 1;
	}

	return Buffer.concat(blocks).subarray(0, length);
}

export interface DeterministicTestPqcProviderOptions {
	readonly seed: string | Uint8Array;
	readonly name?: string;
}

export function createDeterministicTestPqcProvider(
	options: DeterministicTestPqcProviderOptions,
): PqcProvider {
	const seedBytes =
		typeof options.seed === "string" ? Buffer.from(options.seed, "utf8") : options.seed;
	const kemState = createKemState();

	const deriveSharedSecret = (algorithm: PqcAlgorithm, counter: number): Uint8Array =>
		deriveBytes(seedBytes, `${algorithm}:shared-secret:${counter}`, DEFAULT_SHARED_SECRET_LENGTH);

	return {
		name:
			options.name ??
			`deterministic-pqc-${createHash("sha1").update(seedBytes).digest("hex").slice(0, 8)}`,
		async generateKeyPair({ algorithm }: GenerateKeyPairOptions) {
			return {
				keyPair: {
					algorithm,
					publicKey: deriveBytes(seedBytes, `${algorithm}:public-key`, DEFAULT_SEED_LENGTH),
					privateKey: deriveBytes(seedBytes, `${algorithm}:private-key`, DEFAULT_SEED_LENGTH),
				},
			} satisfies { keyPair: PqcKeyPair };
		},
		async encapsulate({ algorithm, publicKey }: EncapsulateOptions) {
			kemState.counter += 1;
			const counter = kemState.counter;
			const ciphertext = deriveBytes(
				seedBytes,
				`${algorithm}:ciphertext:${counter}`,
				DEFAULT_CIPHERTEXT_LENGTH,
			);
			const sharedSecret = deriveSharedSecret(algorithm, counter);
			const ciphertextKey = `${algorithm}:${toHex(ciphertext)}`;
			kemState.encapsulations.set(ciphertextKey, sharedSecret);
			return {
				ciphertext,
				sharedSecret,
				algorithm,
				publicKey,
			} satisfies EncapsulationResult & { algorithm: PqcAlgorithm; publicKey: Uint8Array };
		},
		async decapsulate({ algorithm, ciphertext }: DecapsulateOptions) {
			const ciphertextKey = `${algorithm}:${toHex(ciphertext)}`;
			const stored = kemState.encapsulations.get(ciphertextKey);
			if (!stored) {
				throw new Error(`Unknown ciphertext for algorithm '${algorithm}'`);
			}
			return stored;
		},
		async sign({ algorithm, data }: SignOptions) {
			const digest = createHash("sha256").update(seedBytes).update(algorithm).update(data).digest();
			return {
				signature: digest.subarray(0, 64),
				algorithm,
			} satisfies SignatureResult;
		},
		async verify({ algorithm, data, signature }: VerifyOptions) {
			const expected = createHash("sha256")
				.update(seedBytes)
				.update(algorithm)
				.update(data)
				.digest()
				.subarray(0, 64);
			return Buffer.compare(expected, signature) === 0;
		},
		async hash(data: Uint8Array, algorithm = "sha3-256") {
			const digest = createHash(algorithm).update(data).digest();
			return { digest, algorithm } satisfies HashResult;
		},
	} satisfies PqcProvider;
}
