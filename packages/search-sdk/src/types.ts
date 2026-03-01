export interface SearchSecurityEnvelope {
	readonly controlPlaneTokenSha256: string | null;
	readonly pqcSignatures: ReadonlyArray<{
		readonly provider: string;
		readonly algorithm: string;
		readonly value: string;
		readonly publicKey: string;
	}>;
	readonly hardwareProvider: string | null;
	readonly attestationStatus: string | null;
	readonly attestationProof: string | null;
}

export interface IndexDocumentRequest {
	readonly tenantId: string;
	readonly documentId: string;
	readonly version: string;
	readonly sourceService: string;
	readonly title?: string | null;
	readonly description?: string | null;
	readonly body?: string | null;
	readonly tags?: readonly string[];
	readonly language?: string;
	readonly metadata?: Record<string, unknown>;
	readonly security: SearchSecurityEnvelope;
	readonly signature: {
		readonly provider: string;
		readonly algorithm: string;
		readonly value: string;
		readonly publicKey: string;
	};
	readonly sseTokens?: readonly string[];
}

export interface SearchQueryRequest {
	readonly tenantId: string;
	readonly query?: string;
	readonly limit?: number;
	readonly cursor?: string | null;
	readonly language?: string;
	readonly sseTokens?: readonly string[];
}

export interface SearchDocumentHit {
	readonly tenantId: string;
	readonly documentId: string;
	readonly version: string;
	readonly title: string | null;
	readonly description: string | null;
	readonly tags: string[];
	readonly metadata: Record<string, unknown>;
	readonly score: number;
	readonly updatedAt: string;
}

export interface SearchQueryResponse {
	readonly items: SearchDocumentHit[];
	readonly nextCursor: string | null;
}
