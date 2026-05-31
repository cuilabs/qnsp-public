import { config as loadDotenv } from "dotenv";

const shouldLoadDotenv =
	(process.env["NODE_ENV"] ?? "development") !== "production" ||
	process.env["QNSP_LOAD_ENV_FILE_IN_PROD"] === "true";

if (shouldLoadDotenv) {
	loadDotenv();
}

export interface CliConfig {
	readonly edgeGatewayUrl: string | null;
	readonly cloudPortalUrl: string;
	readonly authServiceUrl: string;
	readonly serviceId: string | null;
	readonly serviceSecret: string | null;
	readonly tenantId: string | null;
	readonly kmsServiceUrl: string;
	readonly vaultServiceUrl: string;
	readonly auditServiceUrl: string;
	readonly tenantServiceUrl: string;
	readonly billingServiceUrl: string;
	readonly accessControlServiceUrl: string;
	readonly securityMonitoringServiceUrl: string;
	readonly storageServiceUrl: string;
	readonly searchServiceUrl: string;
	readonly observabilityServiceUrl: string;
	readonly outputFormat: "json" | "table" | "yaml";
	readonly verbose: boolean;
}

function deriveViaEdgeGateway(options: {
	edgeGatewayUrl: string | null;
	envVar: string;
	proxyPath: string;
	localDefault: string;
}): string {
	const explicit = process.env[options.envVar];
	if (explicit && explicit.length > 0) {
		return explicit;
	}
	if (options.edgeGatewayUrl) {
		return `${options.edgeGatewayUrl.replace(/\/$/, "")}/proxy${options.proxyPath}`;
	}
	return options.localDefault;
}

export function loadConfig(overrides?: Partial<CliConfig>): CliConfig {
	const edgeGatewayUrl = process.env["QNSP_EDGE_GATEWAY_URL"] ?? null;
	const cloudPortalUrl = process.env["QNSP_CLOUD_PORTAL_URL"] ?? "https://cloud.qnsp.cuilabs.io";

	const defaults: CliConfig = {
		edgeGatewayUrl,
		cloudPortalUrl,
		authServiceUrl:
			process.env["QNSP_AUTH_SERVICE_URL"] ?? edgeGatewayUrl ?? "http://localhost:8081",
		serviceId: process.env["QNSP_SERVICE_ID"] ?? null,
		serviceSecret: process.env["QNSP_SERVICE_SECRET"] ?? null,
		tenantId: process.env["QNSP_TENANT_ID"] ?? null,
		kmsServiceUrl: deriveViaEdgeGateway({
			edgeGatewayUrl,
			envVar: "QNSP_KMS_SERVICE_URL",
			proxyPath: "/kms",
			localDefault: "http://localhost:8095",
		}),
		vaultServiceUrl: deriveViaEdgeGateway({
			edgeGatewayUrl,
			envVar: "QNSP_VAULT_SERVICE_URL",
			proxyPath: "/vault",
			localDefault: "http://localhost:8090",
		}),
		auditServiceUrl: deriveViaEdgeGateway({
			edgeGatewayUrl,
			envVar: "QNSP_AUDIT_SERVICE_URL",
			proxyPath: "/audit",
			localDefault: "http://localhost:8103",
		}),
		tenantServiceUrl: deriveViaEdgeGateway({
			edgeGatewayUrl,
			envVar: "QNSP_TENANT_SERVICE_URL",
			proxyPath: "/tenant",
			localDefault: "http://localhost:8108",
		}),
		billingServiceUrl: deriveViaEdgeGateway({
			edgeGatewayUrl,
			envVar: "QNSP_BILLING_SERVICE_URL",
			proxyPath: "/billing",
			localDefault: "http://localhost:8106",
		}),
		accessControlServiceUrl: deriveViaEdgeGateway({
			edgeGatewayUrl,
			envVar: "QNSP_ACCESS_CONTROL_SERVICE_URL",
			proxyPath: "/access",
			localDefault: "http://localhost:8102",
		}),
		securityMonitoringServiceUrl: deriveViaEdgeGateway({
			edgeGatewayUrl,
			envVar: "QNSP_SECURITY_MONITORING_SERVICE_URL",
			proxyPath: "/security",
			localDefault: "http://localhost:8104",
		}),
		storageServiceUrl: deriveViaEdgeGateway({
			edgeGatewayUrl,
			envVar: "QNSP_STORAGE_SERVICE_URL",
			proxyPath: "/storage",
			localDefault: "http://localhost:8092",
		}),
		searchServiceUrl: deriveViaEdgeGateway({
			edgeGatewayUrl,
			envVar: "QNSP_SEARCH_SERVICE_URL",
			proxyPath: "/search",
			localDefault: "http://localhost:8101",
		}),
		observabilityServiceUrl: deriveViaEdgeGateway({
			edgeGatewayUrl,
			envVar: "QNSP_OBSERVABILITY_SERVICE_URL",
			proxyPath: "/observability",
			localDefault: "http://localhost:8105",
		}),
		outputFormat: (process.env["QNSP_OUTPUT_FORMAT"] as "json" | "table" | "yaml") ?? "table",
		verbose: process.env["QNSP_VERBOSE"] === "true",
	};

	return { ...defaults, ...overrides };
}

export const EXIT_CODES = {
	SUCCESS: 0,
	GENERAL_ERROR: 1,
	INVALID_ARGUMENTS: 2,
	AUTH_ERROR: 3,
	AUTHORIZATION_ERROR: 4,
	NOT_FOUND: 5,
	RATE_LIMITED: 6,
	NETWORK_ERROR: 7,
} as const;
