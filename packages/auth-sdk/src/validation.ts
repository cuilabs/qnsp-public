import { z } from "zod";

/**
 * Validation schemas for auth-sdk inputs
 */

export const uuidSchema = z.string().uuid("Invalid UUID format");
export const emailSchema = z.string().email("Invalid email format");
export const urlSchema = z.string().url("Invalid URL format");

/**
 * Validates a UUID string
 */
export function validateUUID(value: string, fieldName: string): void {
	try {
		uuidSchema.parse(value);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(`Invalid ${fieldName}: ${error.issues[0]?.message ?? "Invalid format"}`);
		}
		throw error;
	}
}

/**
 * Validates an email string
 */
export function validateEmail(value: string, fieldName: string): void {
	try {
		emailSchema.parse(value);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(`Invalid ${fieldName}: ${error.issues[0]?.message ?? "Invalid format"}`);
		}
		throw error;
	}
}

/**
 * Validates a URL string
 */
export function validateURL(value: string, fieldName: string): void {
	try {
		urlSchema.parse(value);
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new Error(`Invalid ${fieldName}: ${error.issues[0]?.message ?? "Invalid format"}`);
		}
		throw error;
	}
}
