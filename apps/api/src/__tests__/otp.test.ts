import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@inboxpilot/core", () => ({
	db: { send: vi.fn() },
	sendEmail: vi.fn(),
	generateOTP: vi.fn(() => "123456"),
	otpEmailTemplate: vi.fn(() => "<html>OTP Email</html>"),
	OTP_TTL_SECONDS: 300,
}));

import { db, generateOTP, sendEmail } from "@inboxpilot/core";
import { createAndSendOtp, verifyOtp } from "../services/otp";

const mockSend = vi.mocked(db.send);
const mockSendEmail = vi.mocked(sendEmail);
const mockGenerateOTP = vi.mocked(generateOTP);

describe("otp service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.OTP_TABLE = "test-otp";
		process.env.EMAIL_FROM = "test@inboxpilot.com";
	});

	describe("createAndSendOtp", () => {
		it("should generate OTP, store it, and send email", async () => {
			mockSend.mockResolvedValue({});
			mockSendEmail.mockResolvedValue({});

			await createAndSendOtp("test@example.com");

			expect(mockGenerateOTP).toHaveBeenCalled();
			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					input: expect.objectContaining({
						TableName: "test-otp",
						Item: expect.objectContaining({
							pk: "otp#test@example.com",
							otp: "123456",
							ttl: expect.any(Number),
						}),
					}),
				}),
			);
			expect(mockSendEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					to: ["test@example.com"],
					subject: "123456 — Your InboxPilot verification code",
				}),
			);
		});
	});

	describe("verifyOtp", () => {
		it("should return valid true for correct OTP", async () => {
			const futureTime = Math.floor(Date.now() / 1000) + 300;
			mockSend
				.mockResolvedValueOnce({
					Item: { pk: "otp#test@example.com", otp: "123456", ttl: futureTime },
				})
				.mockResolvedValueOnce({});

			const result = await verifyOtp("test@example.com", "123456");

			expect(result).toEqual({ valid: true });
			expect(mockSend).toHaveBeenCalledTimes(2);
		});

		it("should return valid false for incorrect OTP", async () => {
			const futureTime = Math.floor(Date.now() / 1000) + 300;
			mockSend.mockResolvedValue({
				Item: { pk: "otp#test@example.com", otp: "123456", ttl: futureTime },
			});

			const result = await verifyOtp("test@example.com", "999999");

			expect(result).toEqual({ valid: false, error: "Invalid or expired OTP" });
		});

		it("should return valid false for expired OTP", async () => {
			const pastTime = Math.floor(Date.now() / 1000) - 100;
			mockSend.mockResolvedValue({
				Item: { pk: "otp#test@example.com", otp: "123456", ttl: pastTime },
			});

			const result = await verifyOtp("test@example.com", "123456");

			expect(result).toEqual({ valid: false, error: "Invalid or expired OTP" });
		});
	});
});
