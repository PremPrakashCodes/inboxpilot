import { describe, expect, it } from "vitest";
import {
	createKeySchema,
	deleteKeySchema,
	loginSchema,
	registerSchema,
	updateKeySchema,
	verifySchema,
} from "../validation";

describe("registerSchema", () => {
	it("should accept valid input", () => {
		const validData = {
			name: "John Doe",
			email: "john@example.com",
		};
		const result = registerSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should reject missing name", () => {
		const invalidData = {
			email: "john@example.com",
		};
		const result = registerSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject empty name", () => {
		const invalidData = {
			name: "",
			email: "john@example.com",
		};
		const result = registerSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject name exceeding 100 characters", () => {
		const invalidData = {
			name: "a".repeat(101),
			email: "john@example.com",
		};
		const result = registerSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject invalid email", () => {
		const invalidData = {
			name: "John Doe",
			email: "not-an-email",
		};
		const result = registerSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject email exceeding 254 characters", () => {
		const longEmail = `${"a".repeat(250)}@example.com`;
		const invalidData = {
			name: "John Doe",
			email: longEmail,
		};
		const result = registerSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should accept email at maximum length", () => {
		// Create a valid email at exactly 254 characters
		const localPart = "a".repeat(240);
		const validEmail = `${localPart}@example.com`; // 240 + 1 + 11 = 252 chars
		const validData = {
			name: "John Doe",
			email: validEmail,
		};
		const result = registerSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});
});

describe("loginSchema", () => {
	it("should accept valid email", () => {
		const validData = {
			email: "user@example.com",
		};
		const result = loginSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should reject invalid email", () => {
		const invalidData = {
			email: "invalid-email",
		};
		const result = loginSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject missing email", () => {
		const invalidData = {};
		const result = loginSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject email exceeding 254 characters", () => {
		const longEmail = `${"a".repeat(250)}@example.com`;
		const invalidData = {
			email: longEmail,
		};
		const result = loginSchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});
});

describe("verifySchema", () => {
	it("should accept valid email and OTP", () => {
		const validData = {
			email: "user@example.com",
			otp: "123456",
		};
		const result = verifySchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should require 6-character OTP", () => {
		const invalidData = {
			email: "user@example.com",
			otp: "12345",
		};
		const result = verifySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject OTP longer than 6 characters", () => {
		const invalidData = {
			email: "user@example.com",
			otp: "1234567",
		};
		const result = verifySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject missing OTP", () => {
		const invalidData = {
			email: "user@example.com",
		};
		const result = verifySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject invalid email", () => {
		const invalidData = {
			email: "not-valid",
			otp: "123456",
		};
		const result = verifySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});
});

describe("createKeySchema", () => {
	it("should accept valid input with string expiresIn", () => {
		const validData = {
			name: "My API Key",
			expiresIn: "7d",
		};
		const result = createKeySchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should accept valid input with number expiresIn", () => {
		const validData = {
			name: "My API Key",
			expiresIn: 3600,
		};
		const result = createKeySchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should accept all valid string expiresIn values", () => {
		const validOptions = ["1d", "7d", "1m", "never"];
		validOptions.forEach((option) => {
			const validData = {
				name: "My API Key",
				expiresIn: option,
			};
			const result = createKeySchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	it("should reject invalid string expiresIn", () => {
		const invalidData = {
			name: "My API Key",
			expiresIn: "invalid",
		};
		const result = createKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject negative number expiresIn", () => {
		const invalidData = {
			name: "My API Key",
			expiresIn: -100,
		};
		const result = createKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject zero as expiresIn number", () => {
		const invalidData = {
			name: "My API Key",
			expiresIn: 0,
		};
		const result = createKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject decimal number expiresIn", () => {
		const invalidData = {
			name: "My API Key",
			expiresIn: 3600.5,
		};
		const result = createKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject empty name", () => {
		const invalidData = {
			name: "",
			expiresIn: "7d",
		};
		const result = createKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject name exceeding 100 characters", () => {
		const invalidData = {
			name: "a".repeat(101),
			expiresIn: "7d",
		};
		const result = createKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});
});

describe("updateKeySchema", () => {
	it("should accept partial updates with only name", () => {
		const validData = {
			keyId: "123e4567-e89b-12d3-a456-426614174000",
			name: "Updated Name",
		};
		const result = updateKeySchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should accept partial updates with only expiresIn", () => {
		const validData = {
			keyId: "123e4567-e89b-12d3-a456-426614174000",
			expiresIn: "1m",
		};
		const result = updateKeySchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should accept updates with both name and expiresIn", () => {
		const validData = {
			keyId: "123e4567-e89b-12d3-a456-426614174000",
			name: "Updated Name",
			expiresIn: 7200,
		};
		const result = updateKeySchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should accept updates with only keyId", () => {
		const validData = {
			keyId: "123e4567-e89b-12d3-a456-426614174000",
		};
		const result = updateKeySchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should reject invalid UUID", () => {
		const invalidData = {
			keyId: "not-a-uuid",
			name: "Updated Name",
		};
		const result = updateKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject missing keyId", () => {
		const invalidData = {
			name: "Updated Name",
		};
		const result = updateKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject empty name", () => {
		const invalidData = {
			keyId: "123e4567-e89b-12d3-a456-426614174000",
			name: "",
		};
		const result = updateKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject invalid expiresIn", () => {
		const invalidData = {
			keyId: "123e4567-e89b-12d3-a456-426614174000",
			expiresIn: "invalid",
		};
		const result = updateKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});
});

describe("deleteKeySchema", () => {
	it("should accept valid UUID", () => {
		const validData = {
			keyId: "123e4567-e89b-12d3-a456-426614174000",
		};
		const result = deleteKeySchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("should reject invalid UUID", () => {
		const invalidData = {
			keyId: "not-a-uuid",
		};
		const result = deleteKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject missing keyId", () => {
		const invalidData = {};
		const result = deleteKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});

	it("should reject UUID-like string with wrong format", () => {
		const invalidData = {
			keyId: "123e4567-e89b-12d3-a456-42661417400", // missing one character
		};
		const result = deleteKeySchema.safeParse(invalidData);
		expect(result.success).toBe(false);
	});
});
