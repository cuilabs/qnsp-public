import type { PqcAlgorithm, PqcProvider } from "../provider.js";

export interface ExternalPqcProviderMetadata {
	readonly name: string;
	readonly version?: string;
	readonly author?: string;
	readonly homepage?: string;
	readonly supportedAlgorithms: readonly PqcAlgorithm[];
}

export interface ExternalPqcProviderInitOptions {
	readonly algorithms?: readonly PqcAlgorithm[];
	readonly configuration?: Record<string, unknown>;
	readonly logger?: (message: string) => void;
}

export interface ExternalPqcProviderFactory {
	readonly metadata: ExternalPqcProviderMetadata;
	readonly probe?: () => Promise<boolean>;
	readonly create: (options?: ExternalPqcProviderInitOptions) => Promise<PqcProvider>;
}

const externalFactories = new Map<string, ExternalPqcProviderFactory>();

export function registerExternalPqcProvider(factory: ExternalPqcProviderFactory): void {
	externalFactories.set(factory.metadata.name, factory);
}

export function unregisterExternalPqcProvider(name: string): void {
	externalFactories.delete(name);
}

export function listExternalPqcProviders(): ReadonlyArray<ExternalPqcProviderMetadata> {
	return Array.from(externalFactories.values(), (factory) => factory.metadata);
}

export async function initializeExternalPqcProvider(
	name: string,
	options?: ExternalPqcProviderInitOptions,
): Promise<PqcProvider> {
	const factory = externalFactories.get(name);

	if (!factory) {
		throw new Error(`External PQC provider '${name}' is not registered`);
	}

	if (factory.probe && !(await factory.probe())) {
		throw new Error(`External PQC provider '${name}' probe failed`);
	}

	return factory.create(options);
}
