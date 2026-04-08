import { beforeEach, describe, expect, it, vi } from "vitest";
import type { QnspExecutorConfig } from "./executor.js";
import { QnspExecutor } from "./executor.js";

// ─── Mock @qnsp/ai-sdk ────────────────────────────────────────────────────────

const mockSubmitWorkload = vi.fn();
const mockGetWorkload = vi.fn();

vi.mock("@qnsp/ai-sdk", () => ({
	AiOrchestratorClient: class MockAiOrchestratorClient {
		submitWorkload = mockSubmitWorkload;
		getWorkload = mockGetWorkload;
	},
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_CONFIG: QnspExecutorConfig = {
	apiKey: "qnsp_test_key",
	tenantId: "tenant-uuid-5678",
	// Fast polling for tests
	pollIntervalMs: 0,
	pollTimeoutMs: 5_000,
};

function makeExecutor(overrides?: Partial<QnspExecutorConfig>): QnspExecutor {
	return new QnspExecutor({ ...BASE_CONFIG, ...overrides });
}

function makeWorkloadDetail(status: string, overrides?: Record<string, unknown>) {
	return {
		id: "workload-abc",
		tenantId: "tenant-uuid-5678",
		name: "autogen-python-test",
		status,
		priority: "normal",
		schedulingPolicy: "spot",
		createdAt: "2026-04-07T00:00:00Z",
		updatedAt: "2026-04-07T00:00:01Z",
		acceptedAt: "2026-04-07T00:00:00Z",
		completedAt: "2026-04-07T00:00:01Z",
		labels: {},
		security: {
			controlPlaneTokenSha256: null,
			pqcSignatures: [{ provider: "liboqs", algorithm: "ML-DSA-87" }],
			hardwareProvider: "aws-nitro",
			attestationStatus: "verified",
			attestationProof: "proof-abc123",
		},
		manifest: { pqcSignature: "", algorithm: "none", issuedAt: "2026-04-07T00:00:00Z" },
		resources: { cpu: 1, memoryGiB: 2, gpu: 0, acceleratorType: "nvidia-a100" },
		artifacts: [],
		schedulerMetadata: null,
		...overrides,
	};
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("QnspExecutor", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("execute()", () => {
		it("submits workload and returns result after polling to succeeded", async () => {
			mockSubmitWorkload.mockResolvedValueOnce({
				workloadId: "workload-abc",
				status: "pending",
				replayed: false,
				acceptedAt: "2026-04-07T00:00:00Z",
			});
			mockGetWorkload.mockResolvedValueOnce(makeWorkloadDetail("succeeded"));

			const executor = makeExecutor();
			const result = await executor.execute({ code: "print('hello')", language: "python" });

			expect(result.workloadId).toBe("workload-abc");
			expect(result.status).toBe("succeeded");
			expect(result.replayed).toBe(false);
			expect(result.attestationProof).toBe("proof-abc123");
			expect(result.hardwareProvider).toBe("aws-nitro");
			expect(result.completedAt).toBe("2026-04-07T00:00:01Z");
		});

		it("returns immediately when submit returns a terminal status (replayed)", async () => {
			mockSubmitWorkload.mockResolvedValueOnce({
				workloadId: "workload-xyz",
				status: "succeeded",
				replayed: true,
				acceptedAt: "2026-04-06T00:00:00Z",
			});

			const executor = makeExecutor();
			const result = await executor.execute({
				code: "print('idempotent')",
				idempotencyKey: "key-123",
			});

			expect(result.workloadId).toBe("workload-xyz");
			expect(result.status).toBe("succeeded");
			expect(result.replayed).toBe(true);
			expect(result.attestationProof).toBeNull();
			expect(mockGetWorkload).not.toHaveBeenCalled();
		});

		it("polls multiple times before reaching terminal state", async () => {
			mockSubmitWorkload.mockResolvedValueOnce({
				workloadId: "workload-poll",
				status: "pending",
				replayed: false,
				acceptedAt: null,
			});
			mockGetWorkload
				.mockResolvedValueOnce(makeWorkloadDetail("scheduled"))
				.mockResolvedValueOnce(makeWorkloadDetail("running"))
				.mockResolvedValueOnce(makeWorkloadDetail("succeeded"));

			const executor = makeExecutor();
			const result = await executor.execute({ code: "import time; time.sleep(1)" });

			expect(mockGetWorkload).toHaveBeenCalledTimes(3);
			expect(result.status).toBe("succeeded");
		});

		it("uses correct command for bash language", async () => {
			mockSubmitWorkload.mockResolvedValueOnce({
				workloadId: "w1",
				status: "succeeded",
				replayed: false,
				acceptedAt: null,
			});

			const executor = makeExecutor();
			await executor.execute({ code: "echo hello", language: "bash" });

			const call = mockSubmitWorkload.mock.calls[0]?.[0];
			expect(call?.command).toEqual(["bash", "-c", "echo hello"]);
		});

		it("uses correct command for javascript language", async () => {
			mockSubmitWorkload.mockResolvedValueOnce({
				workloadId: "w1",
				status: "succeeded",
				replayed: false,
				acceptedAt: null,
			});

			const executor = makeExecutor();
			await executor.execute({ code: "console.log('hi')", language: "javascript" });

			const call = mockSubmitWorkload.mock.calls[0]?.[0];
			expect(call?.command).toEqual(["node", "-e", "console.log('hi')"]);
		});

		it("passes env vars to the workload", async () => {
			mockSubmitWorkload.mockResolvedValueOnce({
				workloadId: "w1",
				status: "succeeded",
				replayed: false,
				acceptedAt: null,
			});

			const executor = makeExecutor();
			await executor.execute({
				code: "print(os.environ['MY_VAR'])",
				env: { MY_VAR: "secret-value" },
			});

			const call = mockSubmitWorkload.mock.calls[0]?.[0];
			expect(call?.env).toEqual({ MY_VAR: "secret-value" });
		});

		it("uses on-demand scheduling when gpu > 0", async () => {
			mockSubmitWorkload.mockResolvedValueOnce({
				workloadId: "w1",
				status: "succeeded",
				replayed: false,
				acceptedAt: null,
			});

			const executor = makeExecutor({ gpu: 1 });
			await executor.execute({ code: "import torch" });

			const call = mockSubmitWorkload.mock.calls[0]?.[0];
			expect(call?.schedulingPolicy).toBe("on-demand");
			expect(call?.resources?.gpu).toBe(1);
		});

		it("uses spot scheduling when gpu is 0", async () => {
			mockSubmitWorkload.mockResolvedValueOnce({
				workloadId: "w1",
				status: "succeeded",
				replayed: false,
				acceptedAt: null,
			});

			const executor = makeExecutor();
			await executor.execute({ code: "print('cpu only')" });

			const call = mockSubmitWorkload.mock.calls[0]?.[0];
			expect(call?.schedulingPolicy).toBe("spot");
		});

		it("throws on unsupported language", async () => {
			const executor = makeExecutor();
			await expect(
				// @ts-expect-error — intentionally passing invalid language
				executor.execute({ code: "SELECT 1", language: "sql" }),
			).rejects.toThrow("Unsupported language: sql");
			expect(mockSubmitWorkload).not.toHaveBeenCalled();
		});

		it("throws when poll timeout is exceeded", async () => {
			mockSubmitWorkload.mockResolvedValueOnce({
				workloadId: "w-slow",
				status: "running",
				replayed: false,
				acceptedAt: null,
			});
			// Always return running — never completes
			mockGetWorkload.mockResolvedValue(makeWorkloadDetail("running"));

			const executor = makeExecutor({ pollTimeoutMs: 50, pollIntervalMs: 10 });
			await expect(executor.execute({ code: "import time; time.sleep(999)" })).rejects.toThrow(
				"did not complete within",
			);
		});

		it("propagates submit errors", async () => {
			mockSubmitWorkload.mockRejectedValueOnce(new Error("AI API error: 503"));
			const executor = makeExecutor();
			await expect(executor.execute({ code: "print('x')" })).rejects.toThrow("AI API error: 503");
		});

		it("handles missing security profile gracefully", async () => {
			mockSubmitWorkload.mockResolvedValueOnce({
				workloadId: "w1",
				status: "pending",
				replayed: false,
				acceptedAt: null,
			});
			mockGetWorkload.mockResolvedValueOnce(makeWorkloadDetail("succeeded", { security: null }));

			const executor = makeExecutor();
			const result = await executor.execute({ code: "print('x')" });

			expect(result.attestationProof).toBeNull();
			expect(result.hardwareProvider).toBeNull();
		});
	});
});
