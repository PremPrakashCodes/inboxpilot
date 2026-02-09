const crypto = require("crypto");
const { google } = require("googleapis");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  PutCommand,
  GetCommand,
  DynamoDBDocumentClient,
} = require("@aws-sdk/lib-dynamodb");

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function generateSessionToken() {
  return crypto.randomUUID();
}

exports.handler = async (event) => {
  const code = event.queryStringParameters?.code;
  const oauth2Client = getOAuth2Client();

  // No code — redirect to Google consent screen
  if (!code) {
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.modify",
      ],
    });

    return {
      statusCode: 302,
      headers: { Location: url },
    };
  }

  // Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // Get user info
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: userInfo } = await oauth2.userinfo.get();
  const email = userInfo.email;
  const now = new Date().toISOString();

  // Store Gmail tokens in accounts table
  await db.send(
    new PutCommand({
      TableName: process.env.ACCOUNTS_TABLE,
      Item: {
        pk: email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        scope: tokens.scope,
        createdAt: now,
      },
    })
  );

  // Create or update user record
  const existingUser = await db.send(
    new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { pk: email },
    })
  );

  const isNewUser = !existingUser.Item;
  await db.send(
    new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        pk: email,
        name: userInfo.name || "",
        picture: userInfo.picture || "",
        ...(isNewUser ? { createdAt: now } : { createdAt: existingUser.Item.createdAt }),
        updatedAt: now,
      },
    })
  );

  // Generate session token with 30-day expiry
  const sessionToken = generateSessionToken();
  const ttl = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

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

  // Store pointer so we can find it by email
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Gmail connected successfully",
      email,
      sessionToken,
      createdAt: now,
      expiresIn: "30 days",
    }),
  };
};
