import { describe, expect, it } from "vitest";

import { createCounter, createHistogram, createMeterProvider } from "./metrics.js";

describe("metrics", () => {
	it("creates counters and histograms", () => {
		const provider = createMeterProvider({ serviceName: "observability-test" });
		const counter = createCounter(provider, "requests_total", {
			description: "Number of requests",
		});
		const histogram = createHistogram(provider, "request_duration_ms");

		expect(counter).toBeDefined();
		expect(histogram).toBeDefined();
	});
});
