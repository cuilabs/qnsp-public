import { type Attributes, metrics } from "@opentelemetry/api";
import type { MetricReader } from "@opentelemetry/sdk-metrics";
import { MeterProvider } from "@opentelemetry/sdk-metrics";

export { ConsoleMetricExporter, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

import { enrichMetricAttributes } from "./integrity.js";
import { createTelemetryResource, type TelemetryResourceOptions } from "./resource.js";

export interface MetricsOptions extends TelemetryResourceOptions {}

export function createMeterProvider(
	options: MetricsOptions,
	readers: readonly MetricReader[] = [],
): MeterProvider {
	const provider = new MeterProvider({
		resource: createTelemetryResource(options),
		readers: [...readers],
	});
	metrics.setGlobalMeterProvider(provider);
	return provider;
}

export function createCounter(
	provider: MeterProvider,
	name: string,
	options?: Parameters<ReturnType<MeterProvider["getMeter"]>["createCounter"]>[1],
) {
	return provider.getMeter("qnsp").createCounter(name, options);
}

export function createHistogram(
	provider: MeterProvider,
	name: string,
	options?: Parameters<ReturnType<MeterProvider["getMeter"]>["createHistogram"]>[1],
) {
	return provider.getMeter("qnsp").createHistogram(name, options);
}

export interface EnrichedCounter {
	add(value: number, attributes?: Attributes): void;
}

export interface EnrichedHistogram {
	record(value: number, attributes?: Attributes): void;
}

export interface IntegrityOptions {
	readonly sourceService?: string;
	readonly pqc?: {
		readonly algorithm?: string;
		readonly keyId?: string;
		readonly provider?: string;
	};
}

/**
 * Creates a counter that automatically enriches attributes with provenance and PQC signature fields.
 */
export function createEnrichedCounter(
	provider: MeterProvider,
	name: string,
	options?: Parameters<ReturnType<MeterProvider["getMeter"]>["createCounter"]>[1],
	integrityOptions?: IntegrityOptions,
): EnrichedCounter {
	const counter = createCounter(provider, name, options);

	return {
		add: (value: number, attributes?: Attributes) => {
			const enriched = enrichMetricAttributes(attributes, integrityOptions);
			counter.add(value, enriched);
		},
	};
}

/**
 * Creates a histogram that automatically enriches attributes with provenance and PQC signature fields.
 */
export function createEnrichedHistogram(
	provider: MeterProvider,
	name: string,
	options?: Parameters<ReturnType<MeterProvider["getMeter"]>["createHistogram"]>[1],
	integrityOptions?: IntegrityOptions,
): EnrichedHistogram {
	const histogram = createHistogram(provider, name, options);

	return {
		record: (value: number, attributes?: Attributes) => {
			const enriched = enrichMetricAttributes(attributes, integrityOptions);
			histogram.record(value, enriched);
		},
	};
}
