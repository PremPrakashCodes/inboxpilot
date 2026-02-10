import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
	db,
	generateOTP,
	json,
	loginSchema,
	OTP_TTL_SECONDS,
	otpEmailTemplate,
	parseBody,
	sendEmail,
} from "@inboxpilot/core";

export const handler = async (event: { body?: string }) => {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = loginSchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}
	const { email } = parsed.data;

	const user = await db.send(
		new GetCommand({ TableName: process.env.USERS_TABLE, Key: { pk: email } }),
	);
	if (!user.Item)
		return json(404, { error: "User not found. Please register first." });

	const otp = generateOTP();
	const now = new Date().toISOString();
	const ttl = Math.floor(Date.now() / 1000) + OTP_TTL_SECONDS;

	await db.send(
		new PutCommand({
			TableName: process.env.OTP_TABLE,
			Item: { pk: `otp#${email}`, otp, createdAt: now, ttl },
		}),
	);

	try {
		await sendEmail({
			from: process.env.EMAIL_FROM || "InboxPilot <onboarding@resend.dev>",
			to: [email],
			subject: `${otp} — Your InboxPilot verification code`,
			html: otpEmailTemplate(otp),
		});
	} catch {
		return json(500, { error: "Failed to send email. Please try again." });
	}

	return json(200, { message: "OTP sent to your email", email });
};
