const crypto = require("crypto");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, GetCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendEmail(to, otp) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "InboxPilot <onboarding@resend.dev>",
      to: [to],
      subject: `Your InboxPilot code: ${otp}`,
      html: `<h2>Your verification code</h2><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p><p>This code expires in 10 minutes.</p>`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${res.status} ${err}`);
  }
}

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email } = body;

  if (!email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "email is required" }),
    };
  }

  // Check if user exists
  const user = await db.send(
    new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { pk: email },
    })
  );

  if (!user.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "User not found. Please register first." }),
    };
  }

  // Generate OTP and store with 10-minute TTL
  const otp = generateOtp();
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 10 * 60;

  await db.send(
    new PutCommand({
      TableName: process.env.APIKEYS_TABLE,
      Item: {
        pk: `otp#${email}`,
        otp,
        createdAt: now,
        ttl,
      },
    })
  );

  // Send OTP via Resend
  await sendEmail(email, otp);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: "OTP sent to your email", email }),
  };
};
