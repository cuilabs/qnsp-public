/**
 * QNSP Audit — immutable, hash-chained event log. Wraps
 * `apps/audit-service` (`/audit/v1`).
 */

import type { Internal, RequestOptions } from "./_internal.js";

const PATH_PREFIX = "/audit/v1";

export interface LogEventRequest {
	readonly eventType: string;
	readonly payload: Record<string, unknown>;
	readonly tags?: readonly string[];
}

export class AuditClient {
	constructor(private readonly internal: Internal) {}

	logEvent(req: LogEventRequest, opts?: Pick<RequestOptions, "idempotencyKey">) {
		return this.internal.request("POST", `${PATH_PREFIX}/events`, req, opts);
	}

	ingestEvents(events: readonly LogEventRequest[], opts?: Pick<RequestOptions, "idempotencyKey">) {
		return this.internal.request("POST", `${PATH_PREFIX}/events/batch`, { events }, opts);
	}

	listEvents(query?: RequestOptions["query"]) {
		return this.internal.request("GET", `${PATH_PREFIX}/events`, undefined, { query });
	}
}
