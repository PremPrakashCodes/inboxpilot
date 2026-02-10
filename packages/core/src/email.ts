export async function sendEmail(opts: {
	from: string;
	to: string[];
	subject: string;
	html: string;
}) {
	const res = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(opts),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Resend error: ${text}`);
	}
}

export function otpEmailTemplate(otp: string) {
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

export function apiKeyEmailTemplate(apiKey: string, name: string) {
	return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
        <tr><td align="center" style="padding-bottom:24px">
          <span style="font-size:20px;font-weight:600;color:#18181b">InboxPilot</span>
        </td></tr>
        <tr><td align="center" style="padding-bottom:8px">
          <span style="font-size:14px;color:#71717a">Your API Key — ${name}</span>
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px">
          <code style="display:block;font-size:14px;background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:16px;word-break:break-all;color:#18181b">${apiKey}</code>
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px">
          <span style="font-size:13px;color:#a1a1aa">Save this key securely — it won't be shown again. Use it in the <code>Authorization: Bearer &lt;key&gt;</code> header.</span>
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
