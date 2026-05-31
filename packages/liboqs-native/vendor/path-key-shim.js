"use strict";

const Module = require("node:module");

/**
 * Minimal inline re-implementation of the `path-key` package (MIT license).
 * We inject this via NODE_OPTIONS to avoid sandbox permission issues when
 * loading the dependency from the shared node_modules directory.
 */
const vendorPathKey = (options = {}) => {
	const environment = options.env || process.env;
	const platform = options.platform || process.platform;

	if (platform !== "win32") {
		return "PATH";
	}

	return (
		Object.keys(environment)
			.reverse()
			.find((key) => key.toUpperCase() === "PATH") || "Path"
	);
};

const originalLoad = Module._load;

Module._load = function patchedModuleLoad(request, parent, isMain) {
	if (request === "path-key") {
		return vendorPathKey;
	}

	return originalLoad.apply(this, [request, parent, isMain]);
};
