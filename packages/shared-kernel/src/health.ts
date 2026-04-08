import { z } from "zod";

export const componentStatusSchema = z.enum(["ok", "degraded", "critical"]);

export const componentCheckSchema = z.object({
	status: componentStatusSchema,
	latencyMs: z.number().int().min(0).optional(),
	message: z.string().optional(),
	lastCheckedAt: z.string().datetime({ offset: true }).optional(),
});

export const healthStatusSchema = z.object({
	status: componentStatusSchema,
	service: z.string().min(1),
	timestamp: z.string().datetime({ offset: true }),
	version: z.string().optional(),
	components: z.record(z.string(), componentStatusSchema).optional(),
});

export const standardHealthResponseSchema = z.object({
	status: componentStatusSchema,
	service: z.string().min(1),
	version: z.string(),
	timestamp: z.string().datetime({ offset: true }),
	uptime: z.number().int().min(0),
	checks: z.record(z.string(), componentCheckSchema).optional(),
});

export const standardReadyResponseSchema = z.object({
	ready: z.boolean(),
	service: z.string().min(1),
	timestamp: z.string().datetime({ offset: true }),
	checks: z
		.record(
			z.string(),
			z.object({
				ready: z.boolean(),
				message: z.string().optional(),
			}),
		)
		.optional(),
});

export type ComponentStatus = z.infer<typeof componentStatusSchema>;
export type ComponentCheck = z.infer<typeof componentCheckSchema>;
export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type StandardHealthResponse = z.infer<typeof standardHealthResponseSchema>;
export type StandardReadyResponse = z.infer<typeof standardReadyResponseSchema>;

const startTime = Date.now();

export function createHealthStatus(
	service: string,
	status: ComponentStatus = "ok",
	options: {
		readonly version?: string;
		readonly components?: Record<string, ComponentStatus>;
		readonly timestamp?: Date;
	} = {},
): HealthStatus {
	const { version, components, timestamp = new Date() } = options;

	return healthStatusSchema.parse({
		status,
		service,
		timestamp: timestamp.toISOString(),
		version,
		components,
	});
}

export function createStandardHealthResponse(
	service: string,
	version: string,
	options: {
		readonly status?: ComponentStatus;
		readonly checks?: Record<string, ComponentCheck>;
		readonly timestamp?: Date;
	} = {},
): StandardHealthResponse {
	const { status = "ok", checks, timestamp = new Date() } = options;
	const uptime = Math.floor((Date.now() - startTime) / 1000);

	return standardHealthResponseSchema.parse({
		status,
		service,
		version,
		timestamp: timestamp.toISOString(),
		uptime,
		checks,
	});
}

export function createStandardReadyResponse(
	service: string,
	ready: boolean,
	options: {
		readonly checks?: Record<string, { ready: boolean; message?: string }>;
		readonly timestamp?: Date;
	} = {},
): StandardReadyResponse {
	const { checks, timestamp = new Date() } = options;

	return standardReadyResponseSchema.parse({
		ready,
		service,
		timestamp: timestamp.toISOString(),
		checks,
	});
}
