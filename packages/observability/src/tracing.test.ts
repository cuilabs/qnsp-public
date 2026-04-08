import { describe, expect, it } from "vitest";

import { configureNodeTracing, createSpan } from "./tracing.js";

describe("tracing", () => {
	it("creates spans and exports them", async () => {
		const provider = configureNodeTracing({
			serviceName: "observability-test",
			autoShutdown: false,
		});

		expect(() =>
			createSpan(
				"test-span",
				(span) => {
					span.setAttribute("foo", "bar");
					return "done";
				},
				{},
			),
		).not.toThrow();

		await provider.shutdown();
	});
});
