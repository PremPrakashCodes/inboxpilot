import { KeyRound } from "lucide-react";
import { cookies } from "next/headers";
import { KeysClient } from "@/components/dashboard/keys-client";
import { listKeys } from "@/lib/api";

export default async function KeysPage() {
	const cookieStore = await cookies();
	const token = cookieStore.get("inboxpilot_token")?.value ?? "";
	const res = await listKeys(token);
	const keys = res.ok ? res.data.keys : [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">API Keys</h1>
					<p className="text-muted-foreground">
						Create and manage your API keys
					</p>
				</div>
			</div>

			{keys.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
					<KeyRound className="mb-4 h-10 w-10 text-muted-foreground" />
					<p className="text-muted-foreground">No API keys yet</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Create an API key to access the InboxPilot API
					</p>
				</div>
			) : null}

			<KeysClient initialKeys={keys} />
		</div>
	);
}
