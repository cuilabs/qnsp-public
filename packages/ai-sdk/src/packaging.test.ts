import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createModelPackageManifest } from "./packaging.js";

describe("createModelPackageManifest", () => {
	let workspace: string;

	beforeAll(async () => {
		workspace = await mkdtemp(join(tmpdir(), "qnsp-model-"));
		await writeFile(join(workspace, "weights.bin"), "data-1");
		await writeFile(join(workspace, "config.json"), JSON.stringify({ version: 1 }));
	});

	afterAll(async () => {
		await rm(workspace, { recursive: true, force: true });
	});

	it("produces deterministic SHA3-512 checksums for all files", async () => {
		const manifest = await createModelPackageManifest({
			modelName: "resnet",
			version: "1.0.0",
			sourcePath: workspace,
		});

		expect(manifest.modelName).toBe("resnet");
		expect(manifest.files).toHaveLength(2);
		const paths = manifest.files.map((file) => file.path).sort();
		expect(paths).toEqual(["config.json", "weights.bin"]);
		for (const file of manifest.files) {
			expect(file.checksumSha3_512).toMatch(/^[a-f0-9]{128}$/i);
			expect(file.sizeBytes).toBeGreaterThan(0);
		}
	});
});
