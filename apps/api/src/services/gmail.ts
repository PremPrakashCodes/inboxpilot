import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "@inboxpilot/core";
import { google } from "googleapis";

export function getOAuth2Client() {
	return new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		process.env.GOOGLE_REDIRECT_URI,
	);
}

export function generateConsentUrl(userId: string) {
	const stateParam = Buffer.from(JSON.stringify({ userId })).toString(
		"base64url",
	);
	return getOAuth2Client().generateAuthUrl({
		access_type: "offline",
		prompt: "consent",
		state: stateParam,
		scope: [
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
			"https://www.googleapis.com/auth/gmail.readonly",
			"https://www.googleapis.com/auth/gmail.send",
			"https://www.googleapis.com/auth/gmail.modify",
		],
	});
}

export async function exchangeCodeAndSaveAccount(code: string, userId: string) {
	const oauth2Client = getOAuth2Client();
	const { tokens } = await oauth2Client.getToken(code);
	oauth2Client.setCredentials(tokens);

	const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
	const { data: userInfo } = await oauth2.userinfo.get();
	if (!userInfo.email) throw new Error("Could not retrieve email from Google");

	const gmailEmail = userInfo.email;
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
				name: userInfo.name || "",
				picture: userInfo.picture || "",
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

	return { userId, gmailEmail };
}
