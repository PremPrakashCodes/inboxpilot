"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { connectGmail } from "@/lib/api";

function getToken(): string {
	const match = document.cookie.match(/inboxpilot_token=([^;]+)/);
	return match?.[1] ?? "";
}

export function ConnectGmailButton() {
	const [loading, setLoading] = useState(false);

	async function handleConnect() {
		setLoading(true);
		try {
			const res = await connectGmail(getToken());
			if (res.ok && res.data.url) {
				window.location.href = res.data.url;
			} else {
				toast.error("Failed to get OAuth URL");
			}
		} catch {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Button onClick={handleConnect} disabled={loading}>
			<Mail className="mr-2 h-4 w-4" />
			{loading ? "Connecting..." : "Connect Gmail"}
		</Button>
	);
}
