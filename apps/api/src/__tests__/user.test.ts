import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@inboxpilot/core", () => ({
	db: { send: vi.fn() },
}));

import { db } from "@inboxpilot/core";
import { createUser, findUser } from "../services/user";

const mockSend = vi.mocked(db.send);

describe("user service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.USERS_TABLE = "test-users";
	});

	describe("findUser", () => {
		it("should return user when found", async () => {
			const mockUser = { pk: "test@example.com", name: "Test User" };
			mockSend.mockResolvedValue({ Item: mockUser });

			const result = await findUser("test@example.com");

			expect(result).toEqual(mockUser);
			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					input: {
						TableName: "test-users",
						Key: { pk: "test@example.com" },
					},
				}),
			);
		});

		it("should return null when user not found", async () => {
			mockSend.mockResolvedValue({});

			const result = await findUser("notfound@example.com");

			expect(result).toBeNull();
		});
	});

	describe("createUser", () => {
		it("should create user with email and name", async () => {
			mockSend.mockResolvedValue({});

			await createUser("test@example.com", "Test User");

			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					input: expect.objectContaining({
						TableName: "test-users",
						Item: expect.objectContaining({
							pk: "test@example.com",
							name: "Test User",
							createdAt: expect.any(String),
							updatedAt: expect.any(String),
						}),
					}),
				}),
			);
		});
	});
});
