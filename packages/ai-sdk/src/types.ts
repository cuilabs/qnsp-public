export interface RegisterArtifactRequest {
	readonly tenantId: string;
	readonly documentId: string;
	readonly version: number;
}

export interface RegisteredArtifact {
	readonly artifactId: string;
	readonly documentId: string;
	readonly version: number;
	readonly sizeBytes: number;
	readonly checksumSha3: string;
	readonly manifestDigest: string;
	readonly signature: {
		readonly provider: string;
		readonly algorithm: string;
		readonly publicKey: string;
		readonly issuedAt: string;
	};
	readonly createdAt: string;
}

export type WorkloadPriority = "low" | "normal" | "high";
export type SchedulingPolicy = "spot" | "on-demand" | "mixed";
export type WorkloadStatus =
	| "pending"
	| "scheduled"
	| "running"
	| "canceling"
	| "succeeded"
	| "failed"
	| "canceled";

export interface WorkloadArtifactBinding {
	readonly artifactId: string;
	readonly mountPath: string;
	readonly accessMode: "read" | "read-write";
}

export interface WorkloadResources {
	readonly cpu: number;
	readonly memoryGiB: number;
	readonly gpu: number;
	readonly acceleratorType: string;
}

export interface WorkloadManifest {
	readonly pqcSignature: string;
	readonly algorithm: string;
	readonly issuedAt: string;
	readonly [key: string]: unknown;
}

export interface WorkloadSecurityProfile {
	readonly controlPlaneTokenSha256: string | null;
	readonly pqcSignatures: ReadonlyArray<{ provider: string; algorithm: string }>;
	readonly hardwareProvider: string | null;
	readonly attestationStatus: string | null;
	readonly attestationProof: string | null;
}

export interface ModelPackageManifestFile {
	readonly path: string;
	readonly sizeBytes: number;
	readonly checksumSha3_512: string;
}

export interface ModelPackageManifest {
	readonly modelName: string;
	readonly version: string;
	readonly createdAt: string;
	readonly files: ReadonlyArray<ModelPackageManifestFile>;
	readonly metadata?: Record<string, unknown>;
}

export interface ModelDeploymentRequest {
	readonly tenantId: string;
	readonly modelName: string;
	readonly artifactId: string;
	readonly artifactVersion: number;
	readonly runtimeImage: string;
	readonly command?: readonly string[];
	readonly env?: Record<string, string>;
	readonly resources: WorkloadResources;
	readonly labels?: Record<string, string>;
	readonly manifest: ModelPackageManifest;
	readonly priority?: WorkloadPriority;
	readonly schedulingPolicy?: SchedulingPolicy;
}

export interface InferenceRequest {
	readonly tenantId: string;
	readonly modelDeploymentId: string;
	readonly input: Record<string, unknown>;
	readonly priority?: WorkloadPriority;
}

export interface InferenceResponse {
	readonly inferenceId: string;
	readonly workloadId: string;
	readonly status: WorkloadStatus;
	readonly acceptedAt: string | null;
	readonly replayed: boolean;
}

export interface InferenceStreamEvent {
	readonly id: number;
	readonly type: string;
	readonly payload: Record<string, unknown>;
	readonly createdAt: string;
}

export interface SubmitWorkloadRequest {
	readonly tenantId: string;
	readonly name: string;
	readonly priority: WorkloadPriority;
	readonly schedulingPolicy: SchedulingPolicy;
	readonly containerImage: string;
	readonly command: readonly string[];
	readonly env?: Record<string, string>;
	readonly resources: WorkloadResources;
	readonly artifacts: readonly WorkloadArtifactBinding[];
	readonly manifest: WorkloadManifest;
	readonly labels?: Record<string, string>;
	readonly idempotencyKey?: string;
}

export interface SubmitWorkloadResponse {
	readonly workloadId: string;
	readonly status: WorkloadStatus;
	readonly replayed: boolean;
	readonly acceptedAt: string | null;
}

export interface WorkloadSummary {
	readonly id: string;
	readonly tenantId: string;
	readonly name: string;
	readonly status: WorkloadStatus;
	readonly priority: WorkloadPriority;
	readonly schedulingPolicy: SchedulingPolicy;
	readonly createdAt: string;
	readonly updatedAt: string;
	readonly acceptedAt: string | null;
	readonly completedAt: string | null;
	readonly labels: Record<string, string> | null;
	readonly security: WorkloadSecurityProfile;
}

export interface ListWorkloadsResponse {
	readonly items: readonly WorkloadSummary[];
	readonly nextCursor: string | null;
}

export interface WorkloadDetail extends WorkloadSummary {
	readonly manifest: WorkloadManifest;
	readonly resources: WorkloadResources;
	readonly artifacts: readonly WorkloadArtifactBinding[];
	readonly schedulerMetadata: Record<string, unknown> | null;
}
