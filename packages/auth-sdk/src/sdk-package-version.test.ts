import { describe, expect, it } from "vitest";

import packageJson from "../package.json" with { type: "json" };
import { SDK_PACKAGE_VERSION } from "./sdk-package-version.js";

describe("sdk-package-version", () => {
	it("matches package.json version field", () => {
		expect(SDK_PACKAGE_VERSION).toBe(packageJson.version);
	});

	it("is semver-shaped", () => {
		expect(SDK_PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
	});
});
