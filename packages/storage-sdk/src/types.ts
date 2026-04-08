/**
 * Type definitions for storage-sdk advanced features:
 * - Data Classification
 * - Retention Policies
 * - Cross-Region Replication
 * - Intelligent Tiering
 */

// ============================================================================
// Data Classification Types
// ============================================================================

export type PiiType =
	| "email"
	| "phone"
	| "ssn"
	| "credit_card"
	| "passport"
	| "driver_license"
	| "date_of_birth"
	| "address"
	| "ip_address"
	| "medical_record"
	| "financial_account"
	| "biometric"
	| "genetic"
	| "ethnic_origin"
	| "political_opinion"
	| "religious_belief"
	| "sexual_orientation"
	| "trade_union_membership"
	| "custom";

export type ClassificationLevel =
	| "public"
	| "internal"
	| "confidential"
	| "restricted"
	| "top_secret";

export type ClassificationSource = "manual" | "automatic" | "policy" | "ml_model";

export interface ClassificationPattern {
	readonly name: string;
	readonly regex: string;
	readonly piiType?: PiiType;
	readonly weight?: number;
}

export interface ClassificationKeyword {
	readonly term: string;
	readonly caseSensitive?: boolean;
	readonly weight?: number;
}

export interface ClassificationMetadataRule {
	readonly field: string;
	readonly operator: "equals" | "contains" | "starts_with" | "ends_with" | "matches";
	readonly value: string;
	readonly classificationLevel?: ClassificationLevel;
}

export interface ClassificationActions {
	readonly notifyOnDetection?: boolean;
	readonly notifyRecipients?: readonly string[];
	readonly applyEncryption?: boolean;
	readonly restrictAccess?: boolean;
	readonly auditAllAccess?: boolean;
}

export interface CreateClassificationPolicyRequest {
	readonly name: string;
	readonly description?: string;
	readonly classificationLevel: ClassificationLevel;
	readonly sensitivityScore?: number;
	readonly piiDetectionEnabled?: boolean;
	readonly autoClassify?: boolean;
	readonly patterns?: readonly ClassificationPattern[];
	readonly keywords?: readonly ClassificationKeyword[];
	readonly fileTypes?: readonly string[];
	readonly metadataRules?: readonly ClassificationMetadataRule[];
	readonly actions?: ClassificationActions;
}

export interface ClassificationPolicy {
	readonly id: string;
	readonly tenantId: string;
	readonly name: string;
	readonly description: string | null;
	readonly classificationLevel: ClassificationLevel;
	readonly sensitivityScore: number;
	readonly piiDetectionEnabled: boolean;
	readonly autoClassify: boolean;
	readonly patterns: readonly ClassificationPattern[];
	readonly keywords: readonly ClassificationKeyword[];
	readonly fileTypes: readonly string[];
	readonly metadataRules: readonly ClassificationMetadataRule[];
	readonly actions: ClassificationActions;
	readonly enabled: boolean;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface ClassificationPolicySummary {
	readonly id: string;
	readonly name: string;
	readonly description: string | null;
	readonly classificationLevel: ClassificationLevel;
	readonly sensitivityScore: number;
	readonly piiDetectionEnabled: boolean;
	readonly autoClassify: boolean;
	readonly patternsCount: number;
	readonly keywordsCount: number;
	readonly enabled: boolean;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface PiiLocation {
	readonly type: PiiType;
	readonly location: string;
	readonly start?: number;
	readonly end?: number;
	readonly masked?: boolean;
}

export interface ClassifyObjectRequest {
	readonly objectId: string;
	readonly objectPath?: string;
	readonly classificationLevel: ClassificationLevel;
	readonly sensitivityScore?: number;
	readonly confidenceScore?: number;
	readonly classificationSource?: ClassificationSource;
	readonly policyId?: string;
	readonly piiDetected?: boolean;
	readonly piiTypes?: readonly PiiType[];
	readonly piiLocations?: readonly PiiLocation[];
	readonly tags?: readonly string[];
	readonly metadata?: Record<string, unknown>;
	readonly expiresAt?: string;
}

export interface ObjectClassification {
	readonly id: string;
	readonly objectId: string;
	readonly objectPath: string | null;
	readonly classificationLevel: ClassificationLevel;
	readonly sensitivityScore: number;
	readonly confidenceScore: number;
	readonly classificationSource: ClassificationSource;
	readonly policyId: string | null;
	readonly piiDetected: boolean;
	readonly piiTypes: readonly PiiType[];
	readonly piiLocations: readonly PiiLocation[];
	readonly tags: readonly string[];
	readonly metadata: Record<string, unknown>;
	readonly lastScannedAt: string;
	readonly expiresAt: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface ClassificationScanScope {
	readonly pathPrefix?: string;
	readonly fileTypes?: readonly string[];
	readonly modifiedSince?: string;
	readonly excludePaths?: readonly string[];
	readonly maxObjects?: number;
}

export interface StartClassificationScanRequest {
	readonly scanType: "full" | "incremental" | "pii_only" | "reclassify";
	readonly scope?: ClassificationScanScope;
	readonly policies?: readonly string[];
}

export interface ClassificationScan {
	readonly id: string;
	readonly scanType: "full" | "incremental" | "pii_only" | "reclassify";
	readonly scope: ClassificationScanScope;
	readonly status: "pending" | "in_progress" | "completed" | "failed";
	readonly objectsScanned: number;
	readonly objectsClassified: number;
	readonly piiDetections: number;
	readonly errors: number;
	readonly startedAt: string;
	readonly completedAt: string | null;
}

export interface PiiDetection {
	readonly type: string;
	readonly name: string;
	readonly count: number;
	readonly samples: readonly string[];
}

export interface DetectPiiResult {
	readonly piiDetected: boolean;
	readonly detectionCount: number;
	readonly detections: readonly PiiDetection[];
	readonly contentType: string;
	readonly analyzedLength: number;
}

export interface ClassificationStats {
	readonly totalClassifiedObjects: number;
	readonly levelDistribution: Record<string, number>;
	readonly piiStatistics: {
		readonly objectsWithPii: number;
		readonly piiPercentage: number;
		readonly topPiiTypes: readonly { readonly type: string; readonly count: number }[];
	};
	readonly scansLast7Days: Record<string, number>;
}

// ============================================================================
// Retention Policy Types
// ============================================================================

export type RetentionType =
	| "time_based"
	| "access_based"
	| "event_based"
	| "indefinite"
	| "legal_hold";

export type DeletionType = "soft" | "hard" | "secure_erase";

export type LegalHoldType = "litigation" | "regulatory" | "investigation" | "preservation";

export interface RetentionPolicyAppliesTo {
	readonly pathPatterns?: readonly string[];
	readonly fileTypes?: readonly string[];
	readonly classificationLevels?: readonly string[];
	readonly tags?: readonly string[];
	readonly metadata?: Record<string, string>;
}

export interface CreateRetentionPolicyRequest {
	readonly name: string;
	readonly description?: string;
	readonly retentionDays?: number;
	readonly retentionType: RetentionType;
	readonly appliesTo?: RetentionPolicyAppliesTo;
	readonly legalHoldEnabled?: boolean;
	readonly deletionType?: DeletionType;
	readonly archiveBeforeDelete?: boolean;
	readonly notifyBeforeDeletionDays?: number;
	readonly requireApprovalForDeletion?: boolean;
	readonly approvers?: readonly string[];
	readonly priority?: number;
}

export interface RetentionPolicy {
	readonly id: string;
	readonly tenantId: string;
	readonly name: string;
	readonly description: string | null;
	readonly retentionDays: number | null;
	readonly retentionType: RetentionType;
	readonly appliesTo: RetentionPolicyAppliesTo;
	readonly legalHoldEnabled: boolean;
	readonly deletionType: DeletionType;
	readonly archiveBeforeDelete: boolean;
	readonly notifyBeforeDeletionDays: number | null;
	readonly requireApprovalForDeletion: boolean;
	readonly approvers: readonly string[];
	readonly priority: number;
	readonly enabled: boolean;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface RetentionPolicySummary {
	readonly id: string;
	readonly name: string;
	readonly description: string | null;
	readonly retentionDays: number | null;
	readonly retentionType: RetentionType;
	readonly appliesTo: RetentionPolicyAppliesTo;
	readonly legalHoldEnabled: boolean;
	readonly deletionType: DeletionType;
	readonly archiveBeforeDelete: boolean;
	readonly requireApprovalForDeletion: boolean;
	readonly priority: number;
	readonly enabled: boolean;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface PlaceHoldRequest {
	readonly objectId: string;
	readonly holdType: LegalHoldType;
	readonly holdReason: string;
	readonly legalCaseId?: string;
	readonly expiresAt?: string;
}

export interface LegalHold {
	readonly id: string;
	readonly objectId: string;
	readonly holdType: LegalHoldType;
	readonly holdReason: string;
	readonly legalCaseId: string | null;
	readonly expiresAt: string | null;
	readonly releasedAt: string | null;
	readonly releasedBy: string | null;
	readonly releaseReason: string | null;
	readonly createdBy: string;
	readonly createdAt: string;
}

export interface ScheduleDeleteRequest {
	readonly objectId: string;
	readonly objectPath?: string;
	readonly objectMetadata?: Record<string, unknown>;
	readonly scheduledAt: string;
	readonly policyId?: string;
	readonly deletionType?: DeletionType;
	readonly archiveTo?: string;
}

export interface ScheduledDeletion {
	readonly id: string;
	readonly policyId: string | null;
	readonly objectId: string;
	readonly objectPath: string | null;
	readonly deletionType: DeletionType;
	readonly status: "pending" | "pending_approval" | "cancelled" | "executed" | "failed";
	readonly scheduledAt: string;
	readonly executedAt: string | null;
	readonly archivedTo: string | null;
	readonly approvalRequired: boolean;
	readonly approvedBy: string | null;
	readonly approvedAt: string | null;
	readonly errorMessage: string | null;
	readonly createdAt: string;
}

export interface EvaluateRetentionResult {
	readonly objectId: string;
	readonly canDelete: boolean;
	readonly reason: "legal_hold" | "retention_policy" | "no_retention_policy_applies";
	readonly holdId?: string;
	readonly holdType?: LegalHoldType;
	readonly policyId?: string;
	readonly policyName?: string;
	readonly retentionType?: RetentionType;
	readonly retentionDays?: number;
}

// ============================================================================
// Cross-Region Replication Types
// ============================================================================

export type ReplicationMode = "sync" | "async" | "near_sync";

export interface ReplicationFilterRule {
	readonly type: "include" | "exclude";
	readonly field: "path" | "size" | "content_type" | "classification" | "tag";
	readonly operator:
		| "equals"
		| "contains"
		| "starts_with"
		| "ends_with"
		| "greater_than"
		| "less_than";
	readonly value: string | number;
}

export interface CreateReplicationConfigRequest {
	readonly name: string;
	readonly description?: string;
	readonly sourceRegion: string;
	readonly targetRegions: readonly string[];
	readonly replicationMode?: ReplicationMode;
	readonly filterRules?: readonly ReplicationFilterRule[];
	readonly priority?: number;
	readonly bandwidthLimitMbps?: number;
	readonly encryptionInTransit?: boolean;
	readonly verifyChecksum?: boolean;
}

export interface ReplicationConfig {
	readonly id: string;
	readonly tenantId: string;
	readonly name: string;
	readonly description: string | null;
	readonly sourceRegion: string;
	readonly targetRegions: readonly string[];
	readonly replicationMode: ReplicationMode;
	readonly filterRules: readonly ReplicationFilterRule[];
	readonly priority: number;
	readonly bandwidthLimitMbps: number | null;
	readonly encryptionInTransit: boolean;
	readonly verifyChecksum: boolean;
	readonly enabled: boolean;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface ReplicationConfigSummary {
	readonly id: string;
	readonly name: string;
	readonly description: string | null;
	readonly sourceRegion: string;
	readonly targetRegions: readonly string[];
	readonly replicationMode: ReplicationMode;
	readonly filterRulesCount: number;
	readonly priority: number;
	readonly bandwidthLimitMbps: number | null;
	readonly encryptionInTransit: boolean;
	readonly verifyChecksum: boolean;
	readonly enabled: boolean;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface ObjectReplicationStatus {
	readonly id: string;
	readonly sourceRegion: string;
	readonly targetRegion: string;
	readonly status: "pending" | "in_progress" | "completed" | "failed";
	readonly sizeBytes: number;
	readonly bytesReplicated: number;
	readonly sourceChecksum: string | null;
	readonly targetChecksum: string | null;
	readonly replicationStartedAt: string;
	readonly replicationCompletedAt: string | null;
	readonly lastVerifiedAt: string | null;
	readonly retryCount: number;
	readonly errorMessage: string | null;
}

export interface ReplicationMetricsSummary {
	readonly sourceRegion: string;
	readonly targetRegion: string;
	readonly totalObjectsReplicated: number;
	readonly totalBytesReplicated: number;
	readonly totalObjectsFailed: number;
	readonly averageLatencyMs: number;
}

export interface ReplicationMetrics {
	readonly periodDays: number;
	readonly metrics: readonly {
		readonly sourceRegion: string;
		readonly targetRegion: string;
		readonly periodStart: string;
		readonly periodEnd: string;
		readonly objectsReplicated: number;
		readonly bytesReplicated: number;
		readonly objectsFailed: number;
		readonly averageLatencyMs: number;
		readonly p95LatencyMs: number;
		readonly p99LatencyMs: number;
	}[];
	readonly summary: readonly ReplicationMetricsSummary[];
}

export interface RegionHealth {
	readonly status: "healthy" | "degraded" | "unhealthy";
	readonly failedCount: number;
	readonly avgLagMs: number;
	readonly maxLagMs: number;
}

export interface ReplicationHealth {
	readonly status: "healthy" | "degraded" | "unhealthy";
	readonly regions: Record<string, RegionHealth>;
	readonly checkedAt: string;
}

// ============================================================================
// Intelligent Tiering Types
// ============================================================================

export type StorageTier = "hot" | "warm" | "cold" | "archive" | "glacier";

export interface TieringRuleCondition {
	readonly lastAccessedDaysAgo?: number;
	readonly lastModifiedDaysAgo?: number;
	readonly sizeGreaterThanMb?: number;
	readonly sizeLessThanMb?: number;
	readonly fileTypes?: readonly string[];
	readonly excludePaths?: readonly string[];
}

export interface TieringRuleAction {
	readonly targetTier: StorageTier;
	readonly deleteAfterDays?: number;
}

export interface TieringRule {
	readonly name: string;
	readonly condition: TieringRuleCondition;
	readonly action: TieringRuleAction;
	readonly priority?: number;
}

export interface TieringPolicyScope {
	readonly includePaths?: readonly string[];
	readonly excludePaths?: readonly string[];
	readonly includeFileTypes?: readonly string[];
}

export interface CreateTieringPolicyRequest {
	readonly name: string;
	readonly description?: string | null;
	readonly enabled?: boolean;
	readonly rules: readonly TieringRule[];
	readonly scope?: TieringPolicyScope;
}

export interface TieringPolicy {
	readonly id: string;
	readonly tenantId: string;
	readonly name: string;
	readonly description: string | null;
	readonly enabled: boolean;
	readonly rules: readonly TieringRule[];
	readonly scope: TieringPolicyScope;
	readonly lastRunAt: string | null;
	readonly createdAt: string;
	readonly updatedAt: string;
}

export interface TieringTransition {
	readonly objectId: string;
	readonly currentTier: string;
	readonly targetTier: string;
	readonly rule: string;
	readonly sizeMb: number;
}

export interface EvaluateTieringResult {
	readonly transitionId?: string;
	readonly dryRun: boolean;
	readonly objectsMatched: number;
	readonly totalSizeMb: number;
	readonly transitions?: readonly TieringTransition[];
	readonly potentialTransitions?: readonly TieringTransition[];
	readonly estimatedSavingsPercent?: number;
	readonly status?: "in_progress";
}

export interface TieringStats {
	readonly tierDistribution: Record<string, { readonly count: number; readonly sizeGb: number }>;
	readonly totalPolicies: number;
	readonly enabledPolicies: number;
	readonly recentTransitions: readonly {
		readonly id: string;
		readonly policyId: string;
		readonly status: string;
		readonly objectsCount: number;
		readonly totalSizeMb: number;
		readonly startedAt: string;
		readonly completedAt: string | null;
	}[];
}

export interface TieringRecommendation {
	readonly type: "move_to_cold" | "move_to_archive" | "move_to_glacier";
	readonly title: string;
	readonly description: string;
	readonly objectsCount: number;
	readonly sizeGb: number;
	readonly estimatedSavingsPercent: number;
	readonly priority: "low" | "medium" | "high";
}
