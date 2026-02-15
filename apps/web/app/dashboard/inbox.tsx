"use client";

import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { Mail, Reply, Search, Star } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Email } from "@/lib/gmail";

function formatEmailDate(dateStr: string): string {
	const date = new Date(dateStr);
	if (isToday(date)) return format(date, "h:mm a");
	if (isYesterday(date)) return "Yesterday";
	return format(date, "MMM d");
}

function formatFullDate(dateStr: string): string {
	const date = new Date(dateStr);
	return `${format(date, "MMM d, yyyy h:mm a")} (${formatDistanceToNow(date, { addSuffix: true })})`;
}

export function InboxView({
	emails,
	hasAccounts,
}: {
	emails: Email[];
	hasAccounts: boolean;
}) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const selected = emails.find((e) => e.id === selectedId);

	const filtered = query
		? emails.filter(
				(e) =>
					e.from.toLowerCase().includes(query.toLowerCase()) ||
					e.subject.toLowerCase().includes(query.toLowerCase()) ||
					e.snippet.toLowerCase().includes(query.toLowerCase()),
			)
		: emails;

	if (!hasAccounts) {
		return (
			<div className="flex h-svh flex-col items-center justify-center gap-4 px-4 text-center">
				<Mail className="size-12 text-muted-foreground" />
				<div>
					<h2 className="text-lg font-semibold">No accounts connected</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Connect your Gmail account to start seeing your emails here.
					</p>
				</div>
				<a
					href="/api/connect/gmail"
					className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
				>
					Connect Gmail
				</a>
			</div>
		);
	}

	return (
		<div className="flex h-svh">
			{/* Email list */}
			<div className="flex w-full flex-col border-r md:w-100 md:min-w-100">
				<div className="flex items-center gap-2 border-b px-4 py-3">
					<Search className="size-4 text-muted-foreground" />
					<Input
						placeholder="Search emails..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
					/>
				</div>
				<ScrollArea className="flex-1">
					{filtered.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
							<Mail className="size-8" />
							<p className="text-sm">
								{query ? "No emails match your search" : "No emails yet"}
							</p>
						</div>
					) : (
						filtered.map((email) => (
							<button
								key={email.id}
								type="button"
								onClick={() => setSelectedId(email.id)}
								className={`flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
									selectedId === email.id ? "bg-muted" : ""
								}`}
							>
								<div className="flex items-center justify-between gap-2">
									<span
										className={`truncate text-sm ${email.unread ? "font-semibold" : ""}`}
									>
										{email.from}
									</span>
									<span className="shrink-0 text-xs text-muted-foreground">
										{formatEmailDate(email.date)}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<span
										className={`truncate text-sm ${email.unread ? "font-medium" : "text-muted-foreground"}`}
									>
										{email.subject}
									</span>
									{email.starred && (
										<Star className="size-3 shrink-0 fill-yellow-400 text-yellow-400" />
									)}
								</div>
								<span className="truncate text-xs text-muted-foreground">
									{email.snippet}
								</span>
								<Badge variant="outline" className="mt-1 w-fit text-[10px]">
									{email.account}
								</Badge>
							</button>
						))
					)}
				</ScrollArea>
			</div>

			{/* Reading pane */}
			<div className="hidden flex-1 flex-col md:flex">
				{selected ? (
					<>
						<div className="flex items-center justify-between border-b px-6 py-3">
							<div className="min-w-0 flex-1">
								<h2 className="truncate text-lg font-semibold">
									{selected.subject}
								</h2>
								<p className="text-sm text-muted-foreground">
									{selected.from} &lt;{selected.fromEmail}&gt;
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-1">
								<Button variant="ghost" size="icon-sm">
									<Reply className="size-4" />
								</Button>
								<Button variant="ghost" size="icon-sm">
									<Star className="size-4" />
								</Button>
							</div>
						</div>
						<ScrollArea className="flex-1 px-6 py-4">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span>{formatFullDate(selected.date)}</span>
								<span>&middot;</span>
								<Badge variant="outline" className="text-[10px]">
									{selected.account}
								</Badge>
							</div>
							<Separator className="my-4" />
							<pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
								{selected.body || selected.snippet}
							</pre>
						</ScrollArea>
					</>
				) : (
					<div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
						<Mail className="size-10" />
						<p className="text-sm">Select an email to read</p>
					</div>
				)}
			</div>
		</div>
	);
}
