export class Resource {
	public constructor(public readonly attributes: Record<string, unknown>) {}
}

export function resourceFromAttributes(attributes: Record<string, unknown>): Resource {
	return new Resource(attributes);
}
