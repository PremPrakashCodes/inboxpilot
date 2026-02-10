import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { AuthenticatedEvent } from "@inboxpilot/core";
import { db, json } from "@inboxpilot/core";
import { google } from "googleapis";

function getOAuth2Client() {
	return new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		process.env.GOOGLE_REDIRECT_URI,
	);
}

export const handler = async (event: AuthenticatedEvent) => {
	const { code, state } = event.queryStringParameters ?? {};
	if (!code || !state) return json(400, { error: "Missing OAuth parameters" });

	let userId: string;
	try {
		userId = JSON.parse(Buffer.from(state, "base64url").toString()).userId;
	} catch {
		return json(400, { error: "Invalid state" });
	}

	const oauth2Client = getOAuth2Client();

	// biome-ignore lint/suspicious/noExplicitAny: googleapis overload types
	let tokens: any;
	try {
		const result = await oauth2Client.getToken(code);
		tokens = result.tokens;
	} catch {
		return json(400, { error: "Invalid or expired authorization code" });
	}

	oauth2Client.setCredentials(tokens);

	let gmailEmail: string;
	let name = "";
	let picture = "";
	try {
		const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
		const { data: userInfo } = await oauth2.userinfo.get();
		if (!userInfo.email)
			return json(400, { error: "Could not retrieve email from Google" });
		gmailEmail = userInfo.email;
		name = userInfo.name || "";
		picture = userInfo.picture || "";
	} catch {
		return json(401, { error: "Failed to fetch Google user info" });
	}

	const now = new Date().toISOString();

	await db.send(
		new PutCommand({
			TableName: process.env.ACCOUNTS_TABLE,
			Item: {
				userId,
				sk: `google#${gmailEmail}`,
				type: "oauth",
				provider: "google",
				providerAccountId: gmailEmail,
				name,
				picture,
				access_token: tokens.access_token,
				refresh_token: tokens.refresh_token,
				expires_at: tokens.expiry_date,
				token_type: tokens.token_type || "Bearer",
				scope: tokens.scope,
				createdAt: now,
				updatedAt: now,
			},
		}),
	);

	return json(200, {
		message: "Gmail connected successfully",
		userId,
		gmailEmail,
	});
};
