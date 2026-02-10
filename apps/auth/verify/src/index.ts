import crypto from "node:crypto";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import {
	API_KEY_TTL_SECONDS,
	apiKeyEmailTemplate,
	db,
	generateSessionToken,
	json,
	parseBody,
	sendEmail,
	verifySchema,
} from "@inboxpilot/core";

export const handler = async (event: { body?: string }) => {
	const body = parseBody(event);
	if (!body) return json(400, { error: "Invalid JSON" });

	const parsed = verifySchema.safeParse(body);
	if (!parsed.success) {
		return json(400, { error: parsed.error.issues[0].message });
	}
	const { email, otp } = parsed.data;

	// Look up stored OTP
	const result = await db.send(
		new GetCommand({
			TableName: process.env.OTP_TABLE,
			Key: { pk: `otp#${email}` },
		}),
	);
	if (!result.Item || result.Item.otp !== otp) {
		return json(401, { error: "Invalid or expired OTP" });
	}
	if (result.Item.ttl < Math.floor(Date.now() / 1000)) {
		return json(401, { error: "Invalid or expired OTP" });
	}

	// Delete used OTP
	await db.send(
		new DeleteCommand({
			TableName: process.env.OTP_TABLE,
			Key: { pk: `otp#${email}` },
		}),
	);

	// Generate new API key with 30-day expiry
	const token = generateSessionToken();
	const keyId = crypto.randomUUID();
	const name = "Default";
	const now = new Date().toISOString();
	const ttl = Math.floor(Date.now() / 1000) + API_KEY_TTL_SECONDS;
	const expiresAt = new Date(
		Date.now() + API_KEY_TTL_SECONDS * 1000,
	).toISOString();

	await db.send(
		new PutCommand({
			TableName: process.env.APIKEYS_TABLE,
			Item: {
				pk: token,
				userId: email,
				keyId,
				name,
				createdAt: now,
				expiresAt,
				ttl,
			},
		}),
	);
	await db.send(
		new PutCommand({
			TableName: process.env.APIKEYS_TABLE,
			Item: { pk: `keyref#${keyId}`, token, userId: email },
		}),
	);

	try {
		await sendEmail({
			from: process.env.EMAIL_FROM || "InboxPilot <onboarding@resend.dev>",
			to: [email],
			subject: "Your InboxPilot API Key",
			html: apiKeyEmailTemplate(token, name),
		});
	} catch {
		return json(500, {
			error: "Failed to send API key email. Please try again.",
		});
	}

	return json(200, { message: "API key sent to your email", email });
};
