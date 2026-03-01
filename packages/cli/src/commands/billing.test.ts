import { Command } from "commander";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearTokenCache } from "../utils/token-cache.js";
import { registerBillingCommands } from "./billing.js";
import { createMockResponse, mockConfig, setupTestEnvironment } from "./test-utils.js";

describe("Billing commands", () => {
	let program: Command;
	let env: ReturnType<typeof setupTestEnvironment>;

	beforeEach(() => {
		env = setupTestEnvironment();
		program = new Command();
		clearTokenCache();
	});

	afterEach(() => {
		env.cleanup();
	});

	describe("billing addons list", () => {
		it("should list addons successfully", async () => {
			env.mockFetch
				.mockResolvedValueOnce(createMockResponse({ accessToken: "test-token" }))
				.mockResolvedValueOnce(
					createMockResponse({
						addOns: [{ id: "addon-1", name: "Premium Support" }],
					}),
				);

			registerBillingCommands(program, mockConfig);
			try {
				await program.parseAsync(["node", "test", "billing", "addons", "list"]);
			} catch {
				// expected process.exit
			}

			expect(env.mockExit).toHaveBeenCalledWith(0);
			expect(env.mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/addons/test-tenant"),
				expect.any(Object),
			);
		});
	});

	describe("billing addons catalog", () => {
		it("should list catalog successfully", async () => {
			env.mockFetch
				.mockResolvedValueOnce(createMockResponse({ accessToken: "test-token" }))
				.mockResolvedValueOnce(
					createMockResponse({
						catalog: [{ id: "addon-1", name: "Premium Support", price: 100 }],
					}),
				);

			registerBillingCommands(program, mockConfig);
			try {
				await program.parseAsync(["node", "test", "billing", "addons", "catalog"]);
			} catch {
				// expected process.exit
			}

			expect(env.mockExit).toHaveBeenCalledWith(0);
			expect(env.mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/addons/catalog"),
				expect.any(Object),
			);
		});
	});

	describe("billing addons enable", () => {
		it("should enable addon successfully", async () => {
			env.mockFetch
				.mockResolvedValueOnce(createMockResponse({ accessToken: "test-token" }))
				.mockResolvedValueOnce(createMockResponse({ success: true }));

			registerBillingCommands(program, mockConfig);
			try {
				await program.parseAsync([
					"node",
					"test",
					"billing",
					"addons",
					"enable",
					"--addon-id",
					"addon-1",
				]);
			} catch {
				// expected process.exit
			}

			expect(env.mockExit).toHaveBeenCalledWith(0);
			expect(env.mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/addons/enable"),
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({ tenantId: "test-tenant", addonId: "addon-1" }),
				}),
			);
		});
	});

	describe("billing usage", () => {
		it("should get usage successfully", async () => {
			env.mockFetch
				.mockResolvedValueOnce(createMockResponse({ accessToken: "test-token" }))
				.mockResolvedValueOnce(
					createMockResponse({
						usage: { storage: 100, apiCalls: 5000 },
					}),
				);

			registerBillingCommands(program, mockConfig);
			try {
				await program.parseAsync(["node", "test", "billing", "usage"]);
			} catch {
				// expected process.exit
			}

			expect(env.mockExit).toHaveBeenCalledWith(0);
			expect(env.mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/billing/v1/usage/test-tenant"),
				expect.any(Object),
			);
		});
	});
});
