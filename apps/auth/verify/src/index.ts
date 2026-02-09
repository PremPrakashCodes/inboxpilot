import { PutCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { db, json, parseBody, generateSessionToken } from "@inboxpilot/core";

export const handler = async (event: { body?: string }) => {
  const body = parseBody(event);
  if (!body) return json(400, { error: "Invalid JSON" });

  const { email, otp, new: createNew } = body as {
    email?: string;
    otp?: string;
    new?: boolean;
  };
  if (!email || !otp) return json(400, { error: "email and otp are required" });

  // Look up stored OTP
  const result = await db.send(
    new GetCommand({ TableName: process.env.APIKEYS_TABLE, Key: { pk: `otp#${email}` } })
  );
  if (!result.Item || result.Item.otp !== otp) {
    return json(401, { error: "Invalid or expired OTP" });
  }
  if (result.Item.ttl < Math.floor(Date.now() / 1000)) {
    return json(401, { error: "Invalid or expired OTP" });
  }

  // Delete used OTP
  await db.send(
    new DeleteCommand({ TableName: process.env.APIKEYS_TABLE, Key: { pk: `otp#${email}` } })
  );

  // If not requesting new token, check for existing session
  if (!createNew) {
    const existing = await db.send(
      new GetCommand({ TableName: process.env.APIKEYS_TABLE, Key: { pk: `session#${email}` } })
    );
    if (existing.Item && existing.Item.ttl > Math.floor(Date.now() / 1000)) {
      return json(200, {
        message: "Verified successfully",
        email,
        sessionToken: existing.Item.sessionToken,
        createdAt: existing.Item.createdAt,
        expiresIn: "30 days",
      });
    }
  }

  // Generate new session token with 30-day expiry
  const sessionToken = generateSessionToken();
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  await db.send(
    new PutCommand({
      TableName: process.env.APIKEYS_TABLE,
      Item: { pk: sessionToken, userId: email, createdAt: now, ttl },
    })
  );
  await db.send(
    new PutCommand({
      TableName: process.env.APIKEYS_TABLE,
      Item: { pk: `session#${email}`, sessionToken, createdAt: now, ttl },
    })
  );

  return json(200, {
    message: "Verified successfully",
    email,
    sessionToken,
    createdAt: now,
    expiresIn: "30 days",
  });
};
