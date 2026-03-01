import { z } from "zod";

/**
 * Validation schemas for access-control-sdk inputs
 */

export const uuidSchema = z.string().uuid("Invalid UUID format");

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
