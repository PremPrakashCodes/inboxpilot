import { KeyRound, Mail, Plus } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAccounts, listKeys } from "@/lib/api";

export default async function DashboardPage() {
	const cookieStore = await cookies();
	const token = cookieStore.get("inboxpilot_token")?.value ?? "";

	const [accountsRes, keysRes] = await Promise.all([
		listAccounts(token),
		listKeys(token),
	]);

	const accountCount = accountsRes.ok ? accountsRes.data.accounts.length : 0;
	const keyCount = keysRes.ok ? keysRes.data.keys.length : 0;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground">
					Welcome to InboxPilot. Manage your accounts and API keys.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">
							Connected Accounts
						</CardTitle>
						<Mail className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{accountCount}</div>
						<p className="text-xs text-muted-foreground">
							Gmail accounts linked
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">API Keys</CardTitle>
						<KeyRound className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{keyCount}</div>
						<p className="text-xs text-muted-foreground">Active API keys</p>
					</CardContent>
				</Card>
			</div>

			<div>
				<h2 className="mb-3 text-lg font-semibold">Quick Actions</h2>
				<div className="flex flex-wrap gap-3">
					<Button asChild>
						<Link href="/dashboard/accounts">
							<Mail className="mr-2 h-4 w-4" />
							Connect Gmail
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link href="/dashboard/keys">
							<Plus className="mr-2 h-4 w-4" />
							Create API Key
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
