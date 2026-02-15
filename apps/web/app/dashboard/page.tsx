"use client";

import { Mail, Reply, Search, Star } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const emails = [
	{
		id: "1",
		from: "Alice Johnson",
		email: "alice@gmail.com",
		subject: "Project update - Q1 Review",
		preview:
			"Hi, I wanted to share the latest updates on our Q1 review. The numbers are looking great and...",
		date: "10:30 AM",
		unread: true,
		starred: false,
		account: "Gmail",
	},
	{
		id: "2",
		from: "Bob Williams",
		email: "bob@outlook.com",
		subject: "Meeting tomorrow at 3pm",
		preview:
			"Just a reminder that we have a meeting scheduled for tomorrow at 3pm. Please bring your...",
		date: "9:15 AM",
		unread: true,
		starred: true,
		account: "Outlook",
	},
	{
		id: "3",
		from: "GitHub",
		email: "noreply@github.com",
		subject: "[inboxpilot] New pull request #17",
		preview:
			"PremPrakashCodes opened a new pull request in PremPrakashCodes/inboxpilot: Add dashboard...",
		date: "Yesterday",
		unread: false,
		starred: false,
		account: "Gmail",
	},
	{
		id: "4",
		from: "Carol Davis",
		email: "carol@company.com",
		subject: "Re: Budget proposal",
		preview:
			"Thanks for sending the budget proposal. I've reviewed it and have a few suggestions regarding...",
		date: "Yesterday",
		unread: false,
		starred: false,
		account: "Outlook",
	},
	{
		id: "5",
		from: "AWS Notifications",
		email: "no-reply@aws.amazon.com",
		subject: "Your AWS bill for January 2026",
		preview:
			"Your AWS account bill for the month of January 2026 is now available. Total charges: $12.47...",
		date: "Feb 12",
		unread: false,
		starred: false,
		account: "Gmail",
	},
	{
		id: "6",
		from: "David Chen",
		email: "david@startup.io",
		subject: "Partnership opportunity",
		preview:
			"I came across InboxPilot and I think there's a great opportunity for us to collaborate on...",
		date: "Feb 11",
		unread: false,
		starred: true,
		account: "Gmail",
	},
	{
		id: "7",
		from: "Vercel",
		email: "notifications@vercel.com",
		subject: "Deployment successful",
		preview:
			"Your project inboxpilot has been deployed successfully to production. Visit your deployment...",
		date: "Feb 10",
		unread: false,
		starred: false,
		account: "Gmail",
	},
];

const emailBodies: Record<string, string> = {
	"1": `Hi,

I wanted to share the latest updates on our Q1 review. The numbers are looking great and we're on track to exceed our targets.

Key highlights:
- Revenue is up 23% compared to last quarter
- User signups increased by 45%
- Customer retention improved to 94%

Let me know if you'd like to schedule a call to discuss these in more detail.

Best,
Alice`,
	"2": `Just a reminder that we have a meeting scheduled for tomorrow at 3pm.

Please bring your laptop and the latest project files. We'll be reviewing the roadmap for the next sprint and discussing resource allocation.

Agenda:
1. Sprint retrospective (15 min)
2. Roadmap review (30 min)
3. Resource planning (15 min)

See you there!
Bob`,
};

export default function DashboardPage() {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selected = emails.find((e) => e.id === selectedId);

	return (
		<div className="flex h-svh">
			{/* Email list */}
			<div className="flex w-full flex-col border-r md:w-100 md:min-w-100">
				<div className="flex items-center gap-2 border-b px-4 py-3">
					<Search className="size-4 text-muted-foreground" />
					<Input
						placeholder="Search emails..."
						className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
					/>
				</div>
				<ScrollArea className="flex-1">
					{emails.map((email) => (
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
									{email.date}
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
							<div className="flex items-center gap-2">
								<span className="truncate text-xs text-muted-foreground">
									{email.preview}
								</span>
							</div>
							<Badge variant="outline" className="mt-1 w-fit text-[10px]">
								{email.account}
							</Badge>
						</button>
					))}
				</ScrollArea>
			</div>

			{/* Reading pane */}
			<div className="hidden flex-1 flex-col md:flex">
				{selected ? (
					<>
						<div className="flex items-center justify-between border-b px-6 py-3">
							<div>
								<h2 className="text-lg font-semibold">{selected.subject}</h2>
								<p className="text-sm text-muted-foreground">
									{selected.from} &lt;{selected.email}&gt;
								</p>
							</div>
							<div className="flex items-center gap-1">
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
								<span>{selected.date}</span>
								<span>&middot;</span>
								<Badge variant="outline" className="text-[10px]">
									{selected.account}
								</Badge>
							</div>
							<Separator className="my-4" />
							<pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
								{emailBodies[selected.id] ?? selected.preview}
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
