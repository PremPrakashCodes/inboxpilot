import { describe, expect, it } from "vitest";
import { json, parseBody } from "../response";

describe("json", () => {
	it("should return correct statusCode, headers, and JSON stringified body", () => {
		const data = { message: "success", userId: "123" };
		const result = json(200, data);

		expect(result.statusCode).toBe(200);
		expect(result.headers).toEqual({ "Content-Type": "application/json" });
		expect(result.body).toBe(JSON.stringify(data));
	});

	it("should handle different status codes", () => {
		expect(json(201, { created: true }).statusCode).toBe(201);
		expect(json(400, { error: "Bad Request" }).statusCode).toBe(400);
		expect(json(500, { error: "Server Error" }).statusCode).toBe(500);
	});

	it("should stringify various data types", () => {
		expect(json(200, null).body).toBe("null");
		expect(json(200, [1, 2, 3]).body).toBe("[1,2,3]");
		expect(json(200, "string").body).toBe('"string"');
		expect(json(200, 42).body).toBe("42");
		expect(json(200, true).body).toBe("true");
	});
});

describe("parseBody", () => {
	it("should parse valid JSON", () => {
		const event = {
			body: JSON.stringify({ name: "test", email: "test@example.com" }),
		};
		const result = parseBody(event);
		expect(result).toEqual({ name: "test", email: "test@example.com" });
	});

	it("should return empty object for missing body", () => {
		const event = {};
		const result = parseBody(event);
		expect(result).toEqual({});
	});

	it("should return empty object for empty string body", () => {
		const event = { body: "" };
		const result = parseBody(event);
		expect(result).toEqual({});
	});

	it("should return null for invalid JSON", () => {
		const event = { body: "not valid json {" };
		const result = parseBody(event);
		expect(result).toBeNull();
	});

	it("should handle nested objects", () => {
		const event = {
			body: JSON.stringify({
				user: { name: "test", settings: { theme: "dark" } },
			}),
		};
		const result = parseBody(event);
		expect(result).toEqual({
			user: { name: "test", settings: { theme: "dark" } },
		});
	});

	it("should handle arrays", () => {
		const event = {
			body: JSON.stringify([1, 2, 3]),
		};
		const result = parseBody(event);
		expect(result).toEqual([1, 2, 3]);
	});
});
