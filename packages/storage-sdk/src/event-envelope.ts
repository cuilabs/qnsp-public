import { z } from "zod";

export const eventMetadataSchema = z.object({
	correlationId: z.string().uuid().optional(),
	causationId: z.string().uuid().optional(),
	tenantId: z.string().optional(),
	timestamp: z
		.string()
		.datetime({ offset: true })
		.default(() => new Date().toISOString()),
	requestId: z.string().optional(),
	sourceService: z.string().optional(),
	traceId: z.string().optional(),
	spanId: z.string().optional(),
	userId: z.string().optional(),
});

export const eventEnvelopeSchema = z.object({
	id: z
		.string()
		.uuid()
		.default(() => crypto.randomUUID()),
	topic: z.string().min(1),
	version: z.string().min(1).default("1"),
	occuredAt: z
		.string()
		.datetime({ offset: true })
		.default(() => new Date().toISOString()),
	payload: z.unknown(),
	metadata: eventMetadataSchema.default(() => ({
		timestamp: new Date().toISOString(),
	})),
});

export type EventMetadata = z.infer<typeof eventMetadataSchema>;
export type EventEnvelope<TPayload = unknown> = z.infer<typeof eventEnvelopeSchema> & {
	payload: TPayload;
};

export interface CreateEventEnvelopeOptions<TPayload> {
	readonly topic: string;
	readonly version?: string;
	readonly metadata?: EventMetadata;
	readonly payload: TPayload;
}

export function createEventEnvelope<TPayload>(
	options: CreateEventEnvelopeOptions<TPayload>,
): EventEnvelope<TPayload> {
	const envelope = eventEnvelopeSchema.parse({
		topic: options.topic,
		version: options.version,
		payload: options.payload,
		metadata: options.metadata,
	});

	return envelope as EventEnvelope<TPayload>;
}
