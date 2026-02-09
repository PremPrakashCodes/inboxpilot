import { Resend } from "resend";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { db, json, parseBody, generateOTP } from "@inboxpilot/core";

const resend = new Resend(process.env.RESEND_API_KEY);

function otpEmail(otp: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:400px;background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td align="center" style="padding-bottom:24px">
          <span style="font-size:20px;font-weight:600;color:#18181b">InboxPilot</span>
        </td></tr>
        <tr><td align="center" style="padding-bottom:8px">
          <span style="font-size:14px;color:#71717a">Your verification code</span>
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px">
          <span style="font-size:36px;font-weight:700;letter-spacing:6px;color:#18181b">${otp}</span>
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px">
          <span style="font-size:13px;color:#a1a1aa">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</span>
        </td></tr>
        <tr><td align="center">
          <span style="font-size:12px;color:#d4d4d8">&mdash; InboxPilot</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const handler = async (event: { body?: string }) => {
  const body = parseBody(event);
  if (!body) return json(400, { error: "Invalid JSON" });

  const { email } = body as { email?: string };
  if (!email) return json(400, { error: "email is required" });

  const user = await db.send(
    new GetCommand({ TableName: process.env.USERS_TABLE, Key: { pk: email } }),
  );
  if (!user.Item)
    return json(404, { error: "User not found. Please register first." });

  const otp = generateOTP();
  const now = new Date().toISOString();
  const ttl = Math.floor(Date.now() / 1000) + 10 * 60;

  await db.send(
    new PutCommand({
      TableName: process.env.APIKEYS_TABLE,
      Item: { pk: `otp#${email}`, otp, createdAt: now, ttl },
    }),
  );

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "InboxPilot <onboarding@resend.dev>",
    to: [email],
    subject: `${otp} — Your InboxPilot verification code`,
    html: otpEmail(otp),
  });

  if (error) throw new Error(`Resend error: ${error.message}`);

  return json(200, { message: "OTP sent to your email", email });
};
