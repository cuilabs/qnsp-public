import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import type { Resource } from "@opentelemetry/resources";
import { resourceFromAttributes } from "@opentelemetry/resources";

export interface TelemetryResourceOptions {
	readonly serviceName: string;
	readonly serviceVersion?: string;
	readonly environment?: string;
	readonly deploymentId?: string;
	readonly attributes?: Record<string, string | number | boolean>;
	readonly diagnosticsEnabled?: boolean;
}

const DEFAULT_ENVIRONMENT = "development";

export function createTelemetryResource(options: TelemetryResourceOptions): Resource {
	if (options.diagnosticsEnabled) {
		diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
	}

	const attributes: Record<string, string | number | boolean> = {
		"service.name": options.serviceName,
		...(options.serviceVersion ? { "service.version": options.serviceVersion } : {}),
		"deployment.environment": options.environment ?? DEFAULT_ENVIRONMENT,
		...(options.deploymentId ? { "deployment.id": options.deploymentId } : {}),
		...options.attributes,
	};

	return resourceFromAttributes(attributes);
}
