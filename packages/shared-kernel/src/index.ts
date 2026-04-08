export * from "./api-key-auth.js";
export * from "./auth.js";
export * from "./canonical-json.js";
export * from "./constants.js";
export * from "./entitlement-limits.js";
export { createCryptographyError } from "./errors/index.js";
export * from "./errors.js";
export * from "./health.js";
export * from "./input-validation.js";
export * from "./security-headers.js";
export * from "./service-client.js";
export * from "./service-health-registry.js";
export * from "./tier-catalog.js";
export * from "./tier-limits.js";

// Node.js-only utilities (use separate import path to avoid bundling in browser)
// import { benchmark } from "@qnsp/shared-kernel/benchmarks"
// import { loadTest } from "@qnsp/shared-kernel/load-testing"
// import { smokeTest } from "@qnsp/shared-kernel/smoke-test-utils"
