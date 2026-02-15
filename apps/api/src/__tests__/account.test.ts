import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@inboxpilot/core", () => ({
	db: { send: vi.fn() },
}));

import { db } from "@inboxpilot/core";
import { listAccounts } from "../services/account";

const mockSend = vi.mocked(db.send);

describe("account service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.ACCOUNTS_TABLE = "test-accounts";
	});

	describe("listAccounts", () => {
		it("should return mapped accounts for a user", async () => {
			const mockItems = [
				{
					userId: "user1",
					sk: "google#test@gmail.com",
					provider: "google",
					providerAccountId: "test@gmail.com",
					name: "Test User",
					picture: "https://example.com/photo.jpg",
					createdAt: "2024-01-01T00:00:00.000Z",
					access_token: "token123",
				},
			];
			mockSend.mockResolvedValue({ Items: mockItems });

			const result = await listAccounts("user1");

			expect(result).toEqual([
				{
					provider: "google",
					providerAccountId: "test@gmail.com",
					name: "Test User",
					picture: "https://example.com/photo.jpg",
					createdAt: "2024-01-01T00:00:00.000Z",
				},
			]);
			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					input: expect.objectContaining({
						TableName: "test-accounts",
						KeyConditionExpression: "userId = :uid",
						ExpressionAttributeValues: { ":uid": "user1" },
					}),
				}),
			);
		});

		it("should return empty array when no accounts found", async () => {
			mockSend.mockResolvedValue({ Items: [] });

			const result = await listAccounts("user1");

			expect(result).toEqual([]);
		});
	});
});
