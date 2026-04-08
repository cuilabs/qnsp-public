import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
		exclude: ["src/**/*.integration.ts"],
		passWithNoTests: false,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			reportsDirectory: "coverage",
			thresholds: {
				statements: 85,
				branches: 80,
				functions: 85,
				lines: 85,
			},
		},
	},
});
