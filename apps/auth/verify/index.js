const crypto = require("crypto");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  PutCommand,
  GetCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
} = require("@aws-sdk/lib-dynamodb");

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function generateSessionToken() {
  return crypto.randomUUID();
}

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email, otp, new: createNew } = body;

  if (!email || !otp) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "email and otp are required" }),
    };
  }

  // Look up stored OTP
  const result = await db.send(
    new GetCommand({
      TableName: process.env.APIKEYS_TABLE,
      Key: { pk: `otp#${email}` },
    })
  );

  if (!result.Item || result.Item.otp !== otp) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Invalid or expired OTP" }),
    };
  }

  // Check if OTP has expired (TTL is advisory, DynamoDB may not have deleted it yet)
  if (result.Item.ttl < Math.floor(Date.now() / 1000)) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Invalid or expired OTP" }),
    };
  }

  // Delete used OTP
  await db.send(
    new DeleteCommand({
      TableName: process.env.APIKEYS_TABLE,
      Key: { pk: `otp#${email}` },
    })
  );

  // If not requesting new token, check for existing session
  if (!createNew) {
    const existing = await db.send(
      new GetCommand({
        TableName: process.env.APIKEYS_TABLE,
        Key: { pk: `session#${email}` },
      })
    );

    if (existing.Item && existing.Item.ttl > Math.floor(Date.now() / 1000)) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "Verified successfully",
          email,
          sessionToken: existing.Item.sessionToken,
          createdAt: existing.Item.createdAt,
          expiresIn: "30 days",
        }),
      };
    }
  }

  // Generate new session token with 30-day expiry
  const sessionToken = generateSessionToken();
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

  // Store the session token
  await db.send(
    new PutCommand({
      TableName: process.env.APIKEYS_TABLE,
      Item: {
        pk: sessionToken,
        userId: email,
        createdAt: now,
        ttl,
      },
    })
  );

  // Store pointer so we can find it by email next time
  await db.send(
    new PutCommand({
      TableName: process.env.APIKEYS_TABLE,
      Item: {
        pk: `session#${email}`,
        sessionToken,
        createdAt: now,
        ttl,
      },
    })
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: "Verified successfully",
      email,
      sessionToken,
      createdAt: now,
      expiresIn: "30 days",
    }),
  };
};
