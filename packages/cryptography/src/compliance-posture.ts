import {
	formatPqcAlgorithmForTelemetry,
	getPqcFipsFamily,
	type PqcFipsFamily,
} from "./pqc-standards.js";
import type { PqcAlgorithm } from "./provider.js";

export interface CompliancePostureInput {
	readonly pqcAlgorithm?: PqcAlgorithm;
	readonly classicalFipsMode?: boolean;
	readonly pqcFipsValidated?: boolean;
	readonly opensslVersion?: string;
	readonly opensslFipsProviderPath?: string;
	readonly pqcProviderName?: string;
	readonly pqcProviderVersion?: string;
	readonly pqcProviderModulePath?: string;
}

export interface CompliancePostureTelemetry {
	readonly pqc_standard_family?: PqcFipsFamily | null;
	readonly pqc_algorithm?: string;
	readonly pqc_fips_validated: boolean;
	readonly classical_fips_mode?: boolean;
	readonly openssl_version?: string;
	readonly openssl_fips_provider_path?: string;
	readonly pqc_provider?: string;
	readonly pqc_provider_version?: string;
	readonly pqc_provider_module_path?: string;
}

export function getCompliancePostureTelemetry(
	input: CompliancePostureInput = {},
): CompliancePostureTelemetry {
	const pqcFipsValidated = input.pqcFipsValidated ?? false;

	return {
		...(input.pqcAlgorithm
			? {
					pqc_standard_family: getPqcFipsFamily(input.pqcAlgorithm),
					pqc_algorithm: formatPqcAlgorithmForTelemetry(input.pqcAlgorithm),
				}
			: {}),
		pqc_fips_validated: pqcFipsValidated,
		...(typeof input.classicalFipsMode === "boolean"
			? { classical_fips_mode: input.classicalFipsMode }
			: {}),
		...(input.opensslVersion ? { openssl_version: input.opensslVersion } : {}),
		...(input.opensslFipsProviderPath
			? { openssl_fips_provider_path: input.opensslFipsProviderPath }
			: {}),
		...(input.pqcProviderName ? { pqc_provider: input.pqcProviderName } : {}),
		...(input.pqcProviderVersion ? { pqc_provider_version: input.pqcProviderVersion } : {}),
		...(input.pqcProviderModulePath
			? { pqc_provider_module_path: input.pqcProviderModulePath }
			: {}),
	};
}
