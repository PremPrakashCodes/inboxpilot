import { describe, expect, it } from "vitest";
import { generateOTP, generateSessionToken, parseBearerToken } from "../auth";

describe("generateSessionToken", () => {
	it("should return a valid UUID", () => {
		const token = generateSessionToken();
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		expect(token).toMatch(uuidRegex);
	});
});

describe("generateOTP", () => {
	it("should return a 6-digit string", () => {
		const otp = generateOTP();
		expect(otp).toHaveLength(6);
		expect(otp).toMatch(/^\d{6}$/);
	});

	it("should return numbers between 100000-999999", () => {
		// Test multiple times to ensure consistency
		for (let i = 0; i < 100; i++) {
			const otp = generateOTP();
			const num = parseInt(otp, 10);
			expect(num).toBeGreaterThanOrEqual(100000);
			expect(num).toBeLessThan(1000000);
		}
	});
});

describe("parseBearerToken", () => {
	it("should extract token from Bearer authorization header", () => {
		const event = {
			headers: {
				authorization: "Bearer my-secret-token",
			},
		};
		expect(parseBearerToken(event)).toBe("my-secret-token");
	});

	it("should extract token from Bearer Authorization header (capitalized)", () => {
		const event = {
			headers: {
				Authorization: "Bearer my-secret-token",
			},
		};
		expect(parseBearerToken(event)).toBe("my-secret-token");
	});

	it("should handle both authorization and Authorization headers", () => {
		const event1 = {
			headers: {
				authorization: "Bearer token1",
			},
		};
		const event2 = {
			headers: {
				Authorization: "Bearer token2",
			},
		};
		expect(parseBearerToken(event1)).toBe("token1");
		expect(parseBearerToken(event2)).toBe("token2");
	});

	it("should return null for missing header", () => {
		const event = { headers: {} };
		expect(parseBearerToken(event)).toBeNull();
	});

	it("should return null for missing headers object", () => {
		const event = {};
		expect(parseBearerToken(event)).toBeNull();
	});

	it("should return null for non-Bearer scheme", () => {
		const event = {
			headers: {
				authorization: "Basic dXNlcjpwYXNz",
			},
		};
		expect(parseBearerToken(event)).toBeNull();
	});

	it("should return null for Bearer without space", () => {
		const event = {
			headers: {
				authorization: "Bearer",
			},
		};
		expect(parseBearerToken(event)).toBeNull();
	});

	it("should return empty string for Bearer with space but no token", () => {
		const event = {
			headers: {
				authorization: "Bearer ",
			},
		};
		expect(parseBearerToken(event)).toBe("");
	});
});
