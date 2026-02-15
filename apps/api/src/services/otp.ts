import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
	db,
	generateOTP,
	OTP_TTL_SECONDS,
	otpEmailTemplate,
	sendEmail,
} from "@inboxpilot/core";

export async function createAndSendOtp(email: string) {
	const otp = generateOTP();
	const now = new Date().toISOString();
	const ttl = Math.floor(Date.now() / 1000) + OTP_TTL_SECONDS;

	await db.send(
		new PutCommand({
			TableName: process.env.OTP_TABLE,
			Item: { pk: `otp#${email}`, otp, createdAt: now, ttl },
		}),
	);

	await sendEmail({
		from: process.env.EMAIL_FROM || "InboxPilot <onboarding@resend.dev>",
		to: [email],
		subject: `${otp} — Your InboxPilot verification code`,
		html: otpEmailTemplate(otp),
	});
}

export async function verifyOtp(
	email: string,
	otp: string,
): Promise<{ valid: true } | { valid: false; error: string }> {
	const result = await db.send(
		new GetCommand({
			TableName: process.env.OTP_TABLE,
			Key: { pk: `otp#${email}` },
		}),
	);

	if (!result.Item || result.Item.otp !== otp) {
		return { valid: false, error: "Invalid or expired OTP" };
	}
	if (result.Item.ttl < Math.floor(Date.now() / 1000)) {
		return { valid: false, error: "Invalid or expired OTP" };
	}

	await db.send(
		new DeleteCommand({
			TableName: process.env.OTP_TABLE,
			Key: { pk: `otp#${email}` },
		}),
	);

	return { valid: true };
}
