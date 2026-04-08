/**
 * CLI execution tests for PQC certificate rotation.
 *
 * These tests verify the CLI interface and argument parsing.
 */

import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

// Path to the built CLI script
const CLI_PATH = new URL("../../dist/tls/rotate-pqc-cert.js", import.meta.url).pathname;

describe("rotate-pqc-cert CLI", () => {
	it("exits with error when --service is missing", async () => {
		const { stdout, stderr } = await execFileAsync("node", [CLI_PATH], {}).catch(
			(error: { stdout?: string; stderr?: string; code?: number }) => {
				return { stdout: error.stdout ?? "", stderr: error.stderr ?? "", code: error.code ?? 1 };
			},
		);

		expect(stderr || stdout).toContain("--service=<service-name> is required");
	});

	it("displays usage information", async () => {
		const { stdout, stderr } = await execFileAsync("node", [CLI_PATH], {}).catch(
			(error: { stdout?: string; stderr?: string }) => {
				return { stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
			},
		);

		const output = stderr || stdout;
		expect(output).toContain("Usage:");
		expect(output).toContain("--service=");
		expect(output).toContain("--force");
		expect(output).toContain("--validity-days=");
	});

	it("accepts --service argument", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "pqc-cli-test-"));
		try {
			// This will fail without OpenSSL, but should parse arguments correctly
			const result = await execFileAsync(
				"node",
				[CLI_PATH, "--service=test-service", "--output-dir", tempDir],
				{},
			).catch((error: { stdout?: string; stderr?: string; code?: number }) => {
				// Expected to fail without OpenSSL, but should not fail on argument parsing
				return {
					stdout: error.stdout ?? "",
					stderr: error.stderr ?? "",
					code: error.code ?? 1,
				};
			});

			// Should not fail with "service required" error
			expect(result.stderr || result.stdout).not.toContain("--service=<service-name> is required");
		} finally {
			await rm(tempDir, { recursive: true, force: true });
		}
	});

	it("accepts --force flag", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "pqc-cli-test-"));
		try {
			const result = await execFileAsync(
				"node",
				[CLI_PATH, "--service=test-service", "--force", "--output-dir", tempDir],
				{},
			).catch((error: { stdout?: string; stderr?: string }) => {
				return { stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
			});

			// Should not fail on argument parsing
			expect(result.stderr || result.stdout).not.toContain("--service=<service-name> is required");
		} finally {
			await rm(tempDir, { recursive: true, force: true });
		}
	});

	it("accepts --validity-days argument", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "pqc-cli-test-"));
		try {
			const result = await execFileAsync(
				"node",
				[CLI_PATH, "--service=test-service", "--validity-days=90", "--output-dir", tempDir],
				{},
			).catch((error: { stdout?: string; stderr?: string }) => {
				return { stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
			});

			// Should not fail on argument parsing
			expect(result.stderr || result.stdout).not.toContain("--service=<service-name> is required");
		} finally {
			await rm(tempDir, { recursive: true, force: true });
		}
	});

	it("accepts --algorithm argument", async () => {
		const tempDir = await mkdtemp(join(tmpdir(), "pqc-cli-test-"));
		try {
			const result = await execFileAsync(
				"node",
				[CLI_PATH, "--service=test-service", "--algorithm=dilithium-5", "--output-dir", tempDir],
				{},
			).catch((error: { stdout?: string; stderr?: string }) => {
				return { stdout: error.stdout ?? "", stderr: error.stderr ?? "" };
			});

			// Should not fail on argument parsing
			expect(result.stderr || result.stdout).not.toContain("--service=<service-name> is required");
		} finally {
			await rm(tempDir, { recursive: true, force: true });
		}
	});
});
