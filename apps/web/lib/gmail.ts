import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { gmail_v1 } from "googleapis";
import { google } from "googleapis";
import { ACCOUNTS_TABLE, db } from "./db";

function getOAuth2Client() {
	return new google.auth.OAuth2(
		process.env.AUTH_GOOGLE_ID,
		process.env.AUTH_GOOGLE_SECRET,
		`${process.env.NEXTAUTH_URL}/api/connect/gmail/callback`,
	);
}

export function getGmailConnectUrl(userId: string) {
	const state = Buffer.from(JSON.stringify({ userId })).toString("base64url");
	return getOAuth2Client().generateAuthUrl({
		access_type: "offline",
		prompt: "consent",
		state,
		scope: [
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
			"https://www.googleapis.com/auth/gmail.readonly",
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

	const now = new Date().toISOString();
	await db.send(
		new PutCommand({
			TableName: ACCOUNTS_TABLE,
			Item: {
				userId,
				sk: `google#${userInfo.email}`,
				type: "oauth",
				provider: "google",
				providerAccountId: userInfo.email,
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

	return { gmailEmail: userInfo.email };
}

interface GmailAccount {
	userId: string;
	sk: string;
	providerAccountId: string;
	name: string;
	picture: string;
	access_token: string;
	refresh_token: string;
	expires_at: number;
}

export async function getConnectedAccounts(
	userId: string,
): Promise<GmailAccount[]> {
	const result = await db.send(
		new QueryCommand({
			TableName: ACCOUNTS_TABLE,
			KeyConditionExpression: "userId = :uid AND begins_with(sk, :prefix)",
			ExpressionAttributeValues: {
				":uid": userId,
				":prefix": "google#",
			},
		}),
	);
	return (result.Items || []) as GmailAccount[];
}

async function getAuthenticatedClient(account: GmailAccount) {
	const oauth2Client = getOAuth2Client();
	oauth2Client.setCredentials({
		access_token: account.access_token,
		refresh_token: account.refresh_token,
		expiry_date: account.expires_at,
	});

	if (account.expires_at && Date.now() >= account.expires_at) {
		const { credentials } = await oauth2Client.refreshAccessToken();
		oauth2Client.setCredentials(credentials);

		await db.send(
			new UpdateCommand({
				TableName: ACCOUNTS_TABLE,
				Key: { userId: account.userId, sk: account.sk },
				UpdateExpression:
					"SET access_token = :at, expires_at = :ea, updatedAt = :now",
				ExpressionAttributeValues: {
					":at": credentials.access_token,
					":ea": credentials.expiry_date,
					":now": new Date().toISOString(),
				},
			}),
		);
	}

	return oauth2Client;
}

export interface Email {
	id: string;
	threadId: string;
	from: string;
	fromEmail: string;
	to: string;
	subject: string;
	snippet: string;
	body: string;
	date: string;
	unread: boolean;
	starred: boolean;
	labels: string[];
	account: string;
}

type MessagePartHeader = NonNullable<
	gmail_v1.Schema$MessagePart["headers"]
>[number];

function parseHeader(headers: MessagePartHeader[], name: string): string {
	const header = headers.find(
		(h) => h.name?.toLowerCase() === name.toLowerCase(),
	);
	return header?.value ?? "";
}

function parseFrom(from: string): { name: string; email: string } {
	const match = from.match(/^(.+?)\s*<(.+?)>$/);
	if (match) return { name: match[1].replace(/"/g, ""), email: match[2] };
	return { name: from, email: from };
}

function decodeBody(part: gmail_v1.Schema$MessagePart): string {
	if (part.body?.data) {
		return Buffer.from(part.body.data, "base64url").toString("utf-8");
	}
	if (part.parts) {
		for (const sub of part.parts) {
			if (sub.mimeType === "text/plain" && sub.body?.data) {
				return Buffer.from(sub.body.data, "base64url").toString("utf-8");
			}
			const nested = decodeBody(sub);
			if (nested) return nested;
		}
	}
	return "";
}

function parseMessage(
	msg: gmail_v1.Schema$Message,
	accountEmail: string,
): Email {
	const headers = (msg.payload?.headers ?? []) as MessagePartHeader[];
	const { name, email } = parseFrom(parseHeader(headers, "From"));
	const labels = msg.labelIds ?? [];

	return {
		id: msg.id ?? "",
		threadId: msg.threadId ?? "",
		from: name,
		fromEmail: email,
		to: parseHeader(headers, "To"),
		subject: parseHeader(headers, "Subject"),
		snippet: msg.snippet ?? "",
		body: msg.payload ? decodeBody(msg.payload) : "",
		date: parseHeader(headers, "Date"),
		unread: labels.includes("UNREAD"),
		starred: labels.includes("STARRED"),
		labels,
		account: accountEmail,
	};
}

export async function fetchEmails(
	userId: string,
	maxResults = 20,
): Promise<Email[]> {
	const accounts = await getConnectedAccounts(userId);
	const allEmails: Email[] = [];

	for (const account of accounts) {
		try {
			const authClient = await getAuthenticatedClient(account);
			const gmail = google.gmail({ version: "v1", auth: authClient });

			const list = await gmail.users.messages.list({
				userId: "me",
				maxResults,
				labelIds: ["INBOX"],
			});

			const messageIds = list.data.messages ?? [];

			const messages = await Promise.all(
				messageIds.map(async (msg) => {
					const detail = await gmail.users.messages.get({
						userId: "me",
						id: msg.id ?? "",
						format: "full",
					});
					return detail.data;
				}),
			);

			for (const msg of messages) {
				allEmails.push(parseMessage(msg, account.providerAccountId));
			}
		} catch (err) {
			console.error(
				`Failed to fetch emails for ${account.providerAccountId}:`,
				err,
			);
		}
	}

	allEmails.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);
	return allEmails;
}
