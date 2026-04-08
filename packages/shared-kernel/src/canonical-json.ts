export function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(canonicalize);
	}

	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>;
		return Object.keys(record)
			.sort()
			.reduce<Record<string, unknown>>((acc, key) => {
				acc[key] = canonicalize(record[key]);
				return acc;
			}, {});
	}

	return value;
}

export function canonicalJson(value: unknown): string {
	return JSON.stringify(canonicalize(value));
}
