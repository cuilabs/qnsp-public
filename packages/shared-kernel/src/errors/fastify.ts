import { ZodError } from "zod";
import { ApplicationError, ForbiddenError, UnauthorizedError } from "../errors.js";
import { getHttpStatusCode, QNSPError } from "./index.js";

type ReplyLike = {
	status?: (code: number) => ReplyLike;
	code?: (code: number) => ReplyLike;
	header?: (name: string, value: string) => void;
	send: (payload: unknown) => unknown;
};

type RequestLike = {
	id?: string;
	method?: string;
	url?: string;
	headers?: Record<string, unknown>;
};

type LoggerLike = {
	error: (obj: unknown, msg?: string) => void;
	warn: (obj: unknown, msg?: string) => void;
};

type ServerLike = {
	log: LoggerLike;
	setErrorHandler: (
		handler: (error: unknown, request: RequestLike, reply: ReplyLike) => unknown,
	) => void;
};

export type StandardErrorResponse = {
	readonly statusCode: number;
	readonly error: string;
	readonly message: string;
	readonly details?: unknown;
};

export type ErrorMapper = (error: unknown) => StandardErrorResponse | null;

export type FastifyErrorHandlerOptions = {
	readonly serviceName: string;
	readonly exposeInternalMessages?: boolean;
	readonly exposeStack?: boolean;
	readonly mapError?: ErrorMapper;
};

function replyWithStatus(reply: ReplyLike, statusCode: number): ReplyLike {
	if (reply.status) {
		return reply.status(statusCode);
	}
	if (reply.code) {
		return reply.code(statusCode);
	}
	return reply;
}

function safeMessage(message: string, expose: boolean): string {
	return expose ? message : "Internal error";
}

function normalizeUnknownError(error: unknown): Error {
	return error instanceof Error ? error : new Error("Unknown error");
}

export function mapStandardError(
	error: unknown,
	options: FastifyErrorHandlerOptions,
): StandardErrorResponse {
	const mapped = options.mapError?.(error);
	if (mapped) {
		return mapped;
	}

	if (error instanceof ZodError) {
		return {
			statusCode: 400,
			error: "INVALID_REQUEST",
			message: "Validation failed",
			details: error.flatten(),
		};
	}

	if (
		error &&
		typeof error === "object" &&
		"statusCode" in error &&
		"code" in error &&
		typeof (error as { statusCode?: unknown }).statusCode === "number" &&
		typeof (error as { code?: unknown }).code === "string"
	) {
		const typed = error as { statusCode: number; code: string; message?: string };
		return {
			statusCode: typed.statusCode,
			error: typed.code,
			message: typed.message ?? "Request failed",
		};
	}

	if (error instanceof UnauthorizedError) {
		return {
			statusCode: 401,
			error: error.code,
			message: error.message,
			details: error.details,
		};
	}

	if (error instanceof ForbiddenError) {
		return {
			statusCode: 403,
			error: error.code,
			message: error.message,
			details: error.details,
		};
	}

	if (error instanceof ApplicationError) {
		return {
			statusCode: 400,
			error: error.code,
			message: error.message,
			details: error.details,
		};
	}

	if (error instanceof QNSPError) {
		const statusCode = getHttpStatusCode(error);
		return {
			statusCode,
			error: error.code,
			message:
				statusCode >= 500
					? safeMessage(error.message, Boolean(options.exposeInternalMessages))
					: error.message,
			...(error.context ? { details: error.context } : {}),
		};
	}

	const normalized = normalizeUnknownError(error);
	return {
		statusCode: 500,
		error: "INTERNAL_ERROR",
		message: safeMessage(normalized.message, Boolean(options.exposeInternalMessages)),
		...(options.exposeStack ? { details: { stack: normalized.stack } } : {}),
	};
}

export function installFastifyErrorHandler(
	server: ServerLike,
	options: FastifyErrorHandlerOptions,
): void {
	server.setErrorHandler((error, request, reply) => {
		const response = mapStandardError(error, options);
		const statusCode = response.statusCode;
		const requestId = request.id;
		if (requestId && reply.header) {
			reply.header("x-request-id", requestId);
		}

		const normalized = normalizeUnknownError(error);
		const logPayload = {
			err: normalized,
			statusCode,
			code: response.error,
			requestId,
			method: request.method,
			url: request.url,
		};

		if (statusCode >= 500) {
			server.log.error(logPayload, `${options.serviceName} request error`);
		} else {
			server.log.warn(logPayload, `${options.serviceName} request error`);
		}

		return replyWithStatus(reply, statusCode).send(response);
	});
}
