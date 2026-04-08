export enum DiagLogLevel {
	INFO = "info",
}

export class DiagConsoleLogger {
	info(...args: unknown[]): void {
		console.info(...args);
	}
}

export const diag = {
	setLogger: () => {
		// noop
	},
};

// Simple context store for testing
let currentContext = new Map<string | symbol, unknown>();

class ContextMock {
	constructor(private store: Map<string | symbol, unknown>) {}

	getValue(key: string | symbol): unknown {
		return this.store.get(key);
	}

	setValue(key: string | symbol, value: unknown): ContextMock {
		const newStore = new Map(this.store);
		newStore.set(key, value);
		return new ContextMock(newStore);
	}

	deleteValue(key: string | symbol): ContextMock {
		const newStore = new Map(this.store);
		newStore.delete(key);
		return new ContextMock(newStore);
	}
}

export const context = {
	active: () => new ContextMock(currentContext),
	with: <T>(ctx: ContextMock, fn: () => T): T => {
		// Store the context and restore after callback
		const previous = currentContext;
		currentContext = (ctx as unknown as { store: Map<string | symbol, unknown> }).store;
		try {
			return fn();
		} finally {
			currentContext = previous;
		}
	},
};

export const propagation = {
	createContext: (store: Map<string | symbol, unknown>) => store,
	setGlobalContextManager: () => undefined,
	contextManager: {
		enable: () => undefined,
		disable: () => undefined,
	},
	setSpanContext: (_ctx: unknown, fn: () => unknown) => fn(),
};

export const trace = {
	getTracer: () => ({
		startActiveSpan: (
			_name: string,
			optionsOrCallback: unknown,
			contextOrCallback?: unknown,
			maybeCallback?: unknown,
		) => {
			const callback =
				typeof optionsOrCallback === "function"
					? optionsOrCallback
					: typeof contextOrCallback === "function"
						? contextOrCallback
						: typeof maybeCallback === "function"
							? maybeCallback
							: undefined;

			if (!callback) {
				throw new TypeError("callback is not a function");
			}

			const span = new SpanMock();
			const result = callback(span);
			return result;
		},
	}),
	SpanStatusCode: { ERROR: 1 },
};

class MeterMock {
	createCounter(_name: string, _options?: unknown) {
		return { add: () => undefined };
	}

	createHistogram(_name: string, _options?: unknown) {
		return { record: () => undefined };
	}
}

export const metrics = {
	setGlobalMeterProvider: () => undefined,
	getMeter: () => new MeterMock(),
};

export class SpanMock {
	attributes: Record<string, unknown> = {};
	setAttribute(key: string, value: unknown): void {
		this.attributes[key] = value;
	}
	recordException(): void {
		// noop
	}
	setStatus(): void {
		// noop
	}
	end(): void {
		// noop
	}
}
