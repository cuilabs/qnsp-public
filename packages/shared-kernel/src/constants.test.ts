import { describe, expect, it } from "vitest";

import { CLASSIFICATION_LEVELS, DEFAULT_TOKEN_TTL_SECONDS, TOKEN_AUDIENCES } from "./constants.js";

describe("shared-kernel/constants", () => {
	it("exposes classification levels", () => {
		expect(Object.values(CLASSIFICATION_LEVELS)).toContain("confidential");
	});

	it("defines sensible token defaults", () => {
		expect(DEFAULT_TOKEN_TTL_SECONDS).toBe(900);
		expect(Object.values(TOKEN_AUDIENCES)).toContain("platform");
	});
});
