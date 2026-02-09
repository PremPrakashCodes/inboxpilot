import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { db, json, parseBody } from "@inboxpilot/core";

export const handler = async (event: { body?: string }) => {
  const body = parseBody(event);
  if (!body) return json(400, { error: "Invalid JSON" });

  const { name, email } = body as { name?: string; email?: string };
  if (!name || !email) return json(400, { error: "name and email are required" });

  const existing = await db.send(
    new GetCommand({ TableName: process.env.USERS_TABLE, Key: { pk: email } })
  );
  if (existing.Item) return json(409, { error: "User already exists" });

  const now = new Date().toISOString();
  await db.send(
    new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: { pk: email, name, createdAt: now, updatedAt: now },
    })
  );

  return json(201, { message: "User registered successfully", email, name });
};
