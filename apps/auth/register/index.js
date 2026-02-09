const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, GetCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { name, email } = body;

  if (!name || !email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "name and email are required" }),
    };
  }

  // Check if user already exists
  const existing = await db.send(
    new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { pk: email },
    })
  );

  if (existing.Item) {
    return {
      statusCode: 409,
      headers,
      body: JSON.stringify({ error: "User already exists" }),
    };
  }

  const now = new Date().toISOString();

  await db.send(
    new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        pk: email,
        name,
        createdAt: now,
        updatedAt: now,
      },
    })
  );

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ message: "User registered successfully", email, name }),
  };
};
