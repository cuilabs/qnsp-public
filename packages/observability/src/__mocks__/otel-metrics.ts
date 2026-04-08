export class MeterProvider {
	private readonly meters = new Map<string, Meter>();

	constructor(public readonly options: Record<string, unknown>) {}

	addView(): void {
		// noop view registration
	}

	getMeter(name: string): Meter {
		let meter = this.meters.get(name);
		if (!meter) {
			meter = new Meter();
			this.meters.set(name, meter);
		}
		return meter;
	}
}

class Meter {
	createCounter(_name: string, _options?: unknown) {
		return {
			add: () => undefined,
		};
	}

	createHistogram(_name: string, _options?: unknown) {
		return {
			record: () => undefined,
		};
	}
}
