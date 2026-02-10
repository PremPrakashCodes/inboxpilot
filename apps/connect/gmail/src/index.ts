import type { AuthContext, AuthenticatedEvent } from "@inboxpilot/core";
import { json, withAuth } from "@inboxpilot/core";
import { google } from "googleapis";

function getOAuth2Client() {
	return new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		process.env.GOOGLE_REDIRECT_URI,
	);
}

export const handler = withAuth(
	async (_event: AuthenticatedEvent, { userId }: AuthContext) => {
		const stateParam = Buffer.from(JSON.stringify({ userId })).toString(
			"base64url",
		);
		const url = getOAuth2Client().generateAuthUrl({
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
		return json(200, { url });
	},
);
