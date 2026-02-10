import { PutCommand } from "@aws-sdk/lib-dynamodb";
import type { AuthContext, AuthenticatedEvent } from "@inboxpilot/core";
import { db, json, withAuth } from "@inboxpilot/core";
import { google } from "googleapis";

function getOAuth2Client() {
	return new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		process.env.GOOGLE_REDIRECT_URI,
	);
}

// Google OAuth callback — no Bearer auth needed (uses state param)
async function handleCallback(event: AuthenticatedEvent) {
	const { code, state } = event.queryStringParameters ?? {};
	if (!code || !state) return json(400, { error: "Missing OAuth parameters" });

	let userId: string;
	try {
		userId = JSON.parse(Buffer.from(state, "base64url").toString()).userId;
	} catch {
		return json(400, { error: "Invalid state" });
	}

	const oauth2Client = getOAuth2Client();
	const { tokens } = await oauth2Client.getToken(code);
	oauth2Client.setCredentials(tokens);

	const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
	const { data: userInfo } = await oauth2.userinfo.get();
	const gmailEmail = userInfo.email;
	if (!gmailEmail)
		return json(400, { error: "Could not retrieve email from Google" });
	const now = new Date().toISOString();

	await db.send(
		new PutCommand({
			TableName: process.env.ACCOUNTS_TABLE,
			Item: {
				pk: `${userId}#${gmailEmail}`,
				userId,
				gmailEmail,
				name: userInfo.name || "",
				picture: userInfo.picture || "",
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expiryDate: tokens.expiry_date,
				scope: tokens.scope,
				createdAt: now,
			},
		}),
	);

	return json(200, {
		message: "Gmail connected successfully",
		userId,
		gmailEmail,
	});
}

// Initial request — protected with Bearer token
const handleRedirect = withAuth(
	async (_event: AuthenticatedEvent, { userId }: AuthContext) => {
		const stateParam = Buffer.from(JSON.stringify({ userId })).toString(
			"base64url",
		);
		const url = getOAuth2Client().generateAuthUrl({
			access_type: "offline",
			prompt: "consent",
			state: stateParam,
			scope: [
				"https://www.googleapis.com/auth/gmail.readonly",
				"https://www.googleapis.com/auth/gmail.send",
				"https://www.googleapis.com/auth/gmail.modify",
			],
		});
		return json(200, { url });
	},
);

export const handler = async (event: AuthenticatedEvent) => {
	if (event.queryStringParameters?.code && event.queryStringParameters?.state) {
		return handleCallback(event);
	}
	return handleRedirect(event);
};
