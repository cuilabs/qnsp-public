import { context } from "@opentelemetry/api";

export const REQUEST_CONTEXT_KEY = Symbol.for("qnsp.request.context");

export interface RequestContextValue {
	readonly requestId: string;
	readonly tenantId?: string;
	readonly userId?: string;
	readonly attributes?: Record<string, unknown>;
}

export function getRequestContext(): RequestContextValue | undefined {
	const activeCtx = context.active();
	return activeCtx.getValue(REQUEST_CONTEXT_KEY) as RequestContextValue | undefined;
}

export function withRequestContext<T>(value: RequestContextValue, callback: () => T): T {
	const activeCtx = context.active();
	const ctx = activeCtx.setValue(REQUEST_CONTEXT_KEY, value);
	return context.with(ctx, callback);
}
