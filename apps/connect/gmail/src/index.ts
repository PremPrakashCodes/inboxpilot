import { google } from "googleapis";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, json, getSessionUser, parseBearerToken } from "@inboxpilot/core";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export const handler = async (event: {
  queryStringParameters?: Record<string, string>;
  headers?: Record<string, string>;
}) => {
  const oauth2Client = getOAuth2Client();
  const code = event.queryStringParameters?.code;
  const state = event.queryStringParameters?.state;

  // Callback from Google (has code + state)
  if (code && state) {
    let userId: string;
    try {
      userId = JSON.parse(Buffer.from(state, "base64url").toString()).userId;
    } catch {
      return json(400, { error: "Invalid state" });
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    const gmailEmail = userInfo.email!;
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
      })
    );

    return json(200, { message: "Gmail connected successfully", userId, gmailEmail });
  }

  // Initial request — validate Bearer token, redirect to Google
  const token = parseBearerToken(event);
  if (!token) return json(401, { error: "Authorization header required (Bearer <sessionToken>)" });

  const userId = await getSessionUser(token);
  if (!userId) return json(401, { error: "Invalid or expired session token" });

  const stateParam = Buffer.from(JSON.stringify({ userId })).toString("base64url");
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state: stateParam,
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
  });

  return { statusCode: 302, headers: { Location: url } };
};
