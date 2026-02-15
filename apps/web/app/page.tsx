import { ArrowRight, Inbox, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function GmailIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
		>
			<title>Gmail</title>
			<path
				d="M22 6L12 13L2 6V4L12 11L22 4V6Z"
				fill="currentColor"
				opacity="0.7"
			/>
			<path
				d="M2 4H22V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V4Z"
				stroke="currentColor"
				strokeWidth="1.5"
				fill="none"
			/>
		</svg>
	);
}

function OutlookIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
		>
			<title>Outlook</title>
			<rect
				x="3"
				y="4"
				width="18"
				height="16"
				rx="2"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<path
				d="M3 8L12 14L21 8"
				stroke="currentColor"
				strokeWidth="1.5"
				fill="none"
			/>
			<circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
		</svg>
	);
}

const features = [
	{
		icon: GmailIcon,
		title: "Gmail Integration",
		description:
			"Connect your Google accounts with one-click OAuth. Securely access all your Gmail inboxes.",
	},
	{
		icon: OutlookIcon,
		title: "Outlook Integration",
		description:
			"Link Microsoft and Outlook accounts seamlessly. Full support for personal and work emails.",
	},
	{
		icon: Sparkles,
		title: "AI-Powered",
		description:
			"Smart sorting, priority detection, and suggested replies. Let AI handle the noise so you can focus.",
	},
	{
		icon: Inbox,
		title: "Unified Inbox",
		description:
			"All your emails in one place. Search, filter, and manage messages across every connected account.",
	},
];

export default function Home() {
	return (
		<div className="flex min-h-svh flex-col">
			<header className="flex items-center justify-between px-6 py-4 md:px-10">
				<div className="flex items-center gap-2">
					<Mail className="size-5" />
					<span className="text-lg font-semibold tracking-tight">
						InboxPilot
					</span>
				</div>
				<nav className="flex items-center gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/login">Log in</Link>
					</Button>
					<Button size="sm" asChild>
						<Link href="/register">Get Started</Link>
					</Button>
				</nav>
			</header>

			<main className="flex flex-1 flex-col">
				{/* Hero */}
				<section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center md:py-32">
					<div className="mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm text-muted-foreground">
						<Sparkles className="size-3.5" />
						AI-powered email management
					</div>
					<h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
						Your AI-powered inbox for all your email
					</h1>
					<p className="mt-4 max-w-lg text-lg text-muted-foreground">
						Connect Gmail, Outlook, and more into a single unified inbox. Let AI
						help you sort, prioritize, and respond faster.
					</p>
					<div className="mt-8 flex gap-3">
						<Button size="lg" asChild>
							<Link href="/register">
								Get Started
								<ArrowRight />
							</Link>
						</Button>
						<Button variant="outline" size="lg" asChild>
							<Link href="#features">Learn More</Link>
						</Button>
					</div>
				</section>

				{/* Features */}
				<section
					id="features"
					className="border-t px-6 py-20 md:px-10 md:py-24"
				>
					<div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2 md:grid-cols-4">
						{features.map((feature) => (
							<div key={feature.title} className="flex flex-col gap-3">
								<feature.icon className="size-8 text-muted-foreground" />
								<h3 className="text-lg font-semibold">{feature.title}</h3>
								<p className="text-sm leading-relaxed text-muted-foreground">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</section>
			</main>

			<footer className="border-t px-6 py-6 md:px-10">
				<div className="mx-auto flex max-w-4xl items-center justify-between text-sm text-muted-foreground">
					<span>InboxPilot</span>
					<a
						href="https://github.com/PremPrakashCodes/inboxpilot"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors hover:text-foreground"
					>
						GitHub
					</a>
				</div>
			</footer>
		</div>
	);
}
