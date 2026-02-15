import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGenerateAuthUrl = vi.fn();

vi.mock("googleapis", () => ({
	google: {
		auth: {
			// biome-ignore lint/suspicious/noExplicitAny: mock constructor
			OAuth2: vi.fn().mockImplementation(function (this: any) {
				this.generateAuthUrl = mockGenerateAuthUrl;
			}),
		},
	},
}));

import { generateConsentUrl } from "../services/gmail";

describe("gmail service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.GOOGLE_CLIENT_ID = "test-client-id";
		process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
		process.env.GOOGLE_REDIRECT_URI = "https://example.com/callback";
	});

	describe("generateConsentUrl", () => {
		it("should return OAuth URL with state parameter", () => {
			mockGenerateAuthUrl.mockReturnValue(
				"https://accounts.google.com/o/oauth2/v2/auth?state=abc",
			);

			const result = generateConsentUrl("user123");

			expect(result).toBe(
				"https://accounts.google.com/o/oauth2/v2/auth?state=abc",
			);
			expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
				expect.objectContaining({
					access_type: "offline",
					prompt: "consent",
					state: expect.any(String),
					scope: expect.arrayContaining([
						"https://www.googleapis.com/auth/userinfo.email",
						"https://www.googleapis.com/auth/gmail.readonly",
					]),
				}),
			);
		});
	});
});
