import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@inboxpilot/core", () => ({
	db: { send: vi.fn() },
	sendEmail: vi.fn(),
	generateSessionToken: vi.fn(() => "mock-token-uuid"),
	apiKeyEmailTemplate: vi.fn(() => "<html>API Key Email</html>"),
	API_KEY_TTL_SECONDS: 2592000,
	EXPIRY_OPTIONS: {
		"7d": 604800,
		"30d": 2592000,
		"90d": 7776000,
		never: 0,
	},
}));

import { db, sendEmail } from "@inboxpilot/core";
import {
	createApiKey,
	deleteApiKey,
	listApiKeys,
	updateApiKey,
} from "../services/api-key";

const mockSend = vi.mocked(db.send);
const mockSendEmail = vi.mocked(sendEmail);

describe("api-key service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.APIKEYS_TABLE = "test-apikeys";
		process.env.EMAIL_FROM = "test@inboxpilot.com";
	});

	describe("createApiKey", () => {
		it("should create API key and send email", async () => {
			mockSend.mockResolvedValue({});
			mockSendEmail.mockResolvedValue({});

			const result = await createApiKey("user@example.com", "My Key", "30d");

			expect(result).toEqual({
				keyId: expect.any(String),
				name: "My Key",
				expiresAt: expect.any(String),
			});
			expect(mockSend).toHaveBeenCalledTimes(2);
			expect(mockSendEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					to: ["user@example.com"],
					subject: "Your InboxPilot API Key — My Key",
				}),
			);
		});
	});

	describe("listApiKeys", () => {
		it("should filter out keyrefs and expired keys", async () => {
			const now = Math.floor(Date.now() / 1000);
			mockSend.mockResolvedValue({
				Items: [
					{
						pk: "token1",
						keyId: "key1",
						name: "Active Key",
						ttl: now + 1000,
						createdAt: "2024-01-01",
						expiresAt: "2024-12-31",
					},
					{ pk: "keyref#key1", token: "token1" },
					{
						pk: "token2",
						keyId: "key2",
						name: "Expired Key",
						ttl: now - 100,
						createdAt: "2024-01-01",
						expiresAt: "2024-01-02",
					},
					{
						pk: "token3",
						keyId: "key3",
						name: "Never Expires",
						ttl: 0,
						createdAt: "2024-01-01",
					},
				],
			});

			const result = await listApiKeys("user@example.com");

			expect(result).toHaveLength(2);
			expect(result).toEqual([
				{
					keyId: "key1",
					name: "Active Key",
					prefix: "token1...ken1",
					createdAt: "2024-01-01",
					expiresAt: "2024-12-31",
				},
				{
					keyId: "key3",
					name: "Never Expires",
					prefix: "token3...ken3",
					createdAt: "2024-01-01",
					expiresAt: "never",
				},
			]);
		});
	});

	describe("updateApiKey", () => {
		it("should update API key when found and owned by user", async () => {
			mockSend
				.mockResolvedValueOnce({
					Item: { pk: "keyref#key1", token: "token1", userId: "user1" },
				})
				.mockResolvedValueOnce({});

			const result = await updateApiKey("user1", "key1", { name: "New Name" });

			expect(result).toBe("key1");
			expect(mockSend).toHaveBeenCalledTimes(2);
		});

		it("should return null when keyref not found", async () => {
			mockSend.mockResolvedValue({});

			const result = await updateApiKey("user1", "key1", { name: "New Name" });

			expect(result).toBeNull();
		});

		it("should return no_fields when no fields to update", async () => {
			mockSend.mockResolvedValue({
				Item: { pk: "keyref#key1", token: "token1", userId: "user1" },
			});

			const result = await updateApiKey("user1", "key1", {});

			expect(result).toBe("no_fields");
		});
	});

	describe("deleteApiKey", () => {
		it("should delete API key and keyref when found and owned by user", async () => {
			mockSend
				.mockResolvedValueOnce({
					Item: { pk: "keyref#key1", token: "token1", userId: "user1" },
				})
				.mockResolvedValueOnce({})
				.mockResolvedValueOnce({});

			const result = await deleteApiKey("user1", "key1");

			expect(result).toBe("key1");
			expect(mockSend).toHaveBeenCalledTimes(3);
		});

		it("should return null when keyref not found", async () => {
			mockSend.mockResolvedValue({});

			const result = await deleteApiKey("user1", "key1");

			expect(result).toBeNull();
		});
	});
});
