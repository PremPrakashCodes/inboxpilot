import { describe, expect, it } from "vitest";
import {
	API_KEY_TTL_SECONDS,
	EXPIRY_OPTIONS,
	OTP_TTL_SECONDS,
} from "../constants";

describe("OTP_TTL_SECONDS", () => {
	it("should be 600 seconds", () => {
		expect(OTP_TTL_SECONDS).toBe(600);
	});

	it("should equal 10 minutes", () => {
		expect(OTP_TTL_SECONDS).toBe(10 * 60);
	});
});

describe("API_KEY_TTL_SECONDS", () => {
	it("should be 2592000 seconds", () => {
		expect(API_KEY_TTL_SECONDS).toBe(2592000);
	});

	it("should equal 30 days", () => {
		expect(API_KEY_TTL_SECONDS).toBe(30 * 24 * 60 * 60);
	});
});

describe("EXPIRY_OPTIONS", () => {
	it("should have correct value for 1d", () => {
		expect(EXPIRY_OPTIONS["1d"]).toBe(86400);
		expect(EXPIRY_OPTIONS["1d"]).toBe(1 * 24 * 60 * 60);
	});

	it("should have correct value for 7d", () => {
		expect(EXPIRY_OPTIONS["7d"]).toBe(604800);
		expect(EXPIRY_OPTIONS["7d"]).toBe(7 * 24 * 60 * 60);
	});

	it("should have correct value for 1m", () => {
		expect(EXPIRY_OPTIONS["1m"]).toBe(2592000);
		expect(EXPIRY_OPTIONS["1m"]).toBe(30 * 24 * 60 * 60);
	});

	it("should have correct value for never", () => {
		expect(EXPIRY_OPTIONS.never).toBe(0);
	});

	it("should have exactly 4 options", () => {
		expect(Object.keys(EXPIRY_OPTIONS)).toHaveLength(4);
	});

	it("should contain all expected keys", () => {
		expect(EXPIRY_OPTIONS).toHaveProperty("1d");
		expect(EXPIRY_OPTIONS).toHaveProperty("7d");
		expect(EXPIRY_OPTIONS).toHaveProperty("1m");
		expect(EXPIRY_OPTIONS).toHaveProperty("never");
	});
});
