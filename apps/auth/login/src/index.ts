import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { db, json, parseBody, generateOTP } from "@inboxpilot/core";

async function sendEmail(to: string, otp: string) {
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

export const handler = async (event: { body?: string }) => {
  const body = parseBody(event);
  if (!body) return json(400, { error: "Invalid JSON" });

  const { email } = body as { email?: string };
  if (!email) return json(400, { error: "email is required" });

  const user = await db.send(
    new GetCommand({ TableName: process.env.USERS_TABLE, Key: { pk: email } })
  );
  if (!user.Item) return json(404, { error: "User not found. Please register first." });

  const otp = generateOTP();
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 10 * 60;

  await db.send(
    new PutCommand({
      TableName: process.env.APIKEYS_TABLE,
      Item: { pk: `otp#${email}`, otp, createdAt: now, ttl },
    })
  );

  await sendEmail(email, otp);

  return json(200, { message: "OTP sent to your email", email });
};
