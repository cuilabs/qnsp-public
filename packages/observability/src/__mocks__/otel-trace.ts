export class NodeTracerProvider {
	private readonly processors: unknown[] = [];

	constructor(public readonly options: Record<string, unknown>) {}

	addSpanProcessor(processor: unknown): void {
		this.processors.push(processor);
	}

	register(): void {
		// noop
	}

	async shutdown(): Promise<void> {
		// noop
	}

	async forceFlush(): Promise<void> {
		// noop
	}
}

export class BatchSpanProcessor {
	constructor(public readonly exporter: unknown) {}
}

export class ConsoleSpanExporter {}

export class SimpleSpanProcessor {
	constructor(public readonly exporter: InMemorySpanExporter) {
		exporter.__processors.add(this);
	}
}

export class InMemorySpanExporter {
	public readonly spans: unknown[] = [];
	public readonly __processors = new Set<SimpleSpanProcessor>();

	export(spans: unknown[]): void {
		this.spans.push(...spans);
	}

	shutdown(): void {
		this.spans.length = 0;
	}

	reset(): void {
		this.spans.length = 0;
	}

	getFinishedSpans(): unknown[] {
		return this.spans;
	}
}

export type SpanExporter = unknown;
export type SpanProcessor = { onEnd?(span: unknown): void; shutdown?(): Promise<void> };
