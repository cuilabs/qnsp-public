import {
	type Attributes,
	type Span,
	type SpanKind,
	type SpanOptions,
	SpanStatusCode,
	trace,
} from "@opentelemetry/api";
import type { SpanExporter, SpanProcessor } from "@opentelemetry/sdk-trace-node";
import {
	BatchSpanProcessor,
	ConsoleSpanExporter,
	NodeTracerProvider,
} from "@opentelemetry/sdk-trace-node";

import { createTelemetryResource, type TelemetryResourceOptions } from "./resource.js";

export interface TracingOptions extends TelemetryResourceOptions {
	readonly exporter?: SpanExporter;
	readonly processor?: SpanProcessor;
	readonly autoShutdown?: boolean;
}

export function configureNodeTracing(options: TracingOptions): NodeTracerProvider {
	const spanProcessor =
		options.processor ??
		new BatchSpanProcessor(options.exporter ?? new ConsoleSpanExporter(), {
			maxQueueSize: 2048,
			maxExportBatchSize: 512,
		});

	const provider = new NodeTracerProvider({
		resource: createTelemetryResource(options),
		spanProcessors: [spanProcessor],
	});
	provider.register();

	if (options.autoShutdown ?? true) {
		const shutdown = async (): Promise<void> => {
			await provider.shutdown();
		};

		const signals: Array<NodeJS.Signals> = ["SIGINT", "SIGTERM"];
		for (const signal of signals) {
			process.once(signal, () => {
				void shutdown().finally(() => process.exit(0));
			});
		}
	}

	return provider;
}

export function createSpan<T>(
	name: string,
	callback: (span: Span) => T,
	options?: { readonly kind?: SpanKind; readonly attributes?: Attributes },
): T {
	const tracer = trace.getTracer("qnsp");
	const spanOptions: SpanOptions = {};
	if (options?.kind !== undefined) {
		spanOptions.kind = options.kind;
	}
	if (options?.attributes !== undefined) {
		spanOptions.attributes = options.attributes;
	}

	const execute = (span: Span): T => {
		try {
			return callback(span);
		} catch (error) {
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR });
			throw error;
		} finally {
			span.end();
		}
	};

	if (Object.keys(spanOptions).length === 0) {
		return tracer.startActiveSpan(name, execute);
	}

	return tracer.startActiveSpan(name, spanOptions, execute);
}
