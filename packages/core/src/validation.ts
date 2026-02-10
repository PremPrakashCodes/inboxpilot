import { z } from "zod";

export const registerSchema = z.object({
	name: z.string().min(1).max(100),
	email: z.string().email().max(254),
});

export const loginSchema = z.object({
	email: z.string().email().max(254),
});

export const verifySchema = z.object({
	email: z.string().email().max(254),
	otp: z.string().length(6),
});

const expiresInSchema = z.union([
	z.enum(["1d", "7d", "1m", "never"]),
	z.number().int().positive(),
]);

export const createKeySchema = z.object({
	name: z.string().min(1).max(100),
	expiresIn: expiresInSchema,
});

export const updateKeySchema = z.object({
	keyId: z.string().uuid(),
	name: z.string().min(1).max(100).optional(),
	expiresIn: expiresInSchema.optional(),
});

export const deleteKeySchema = z.object({
	keyId: z.string().uuid(),
});

export { z };
