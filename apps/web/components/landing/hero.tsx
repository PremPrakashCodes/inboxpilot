import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
	return (
		<section className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center md:py-32">
			<h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
				One inbox. Zero effort.
			</h1>
			<p className="max-w-xl text-lg text-muted-foreground md:text-xl">
				Your inbox, on autopilot. Manage email programmatically with a simple
				API — passwordless auth, Gmail integration, and full API key management.
			</p>
			<div className="flex gap-4 pt-4">
				<Button asChild size="lg">
					<Link href="/register">Get Started</Link>
				</Button>
				<Button asChild variant="outline" size="lg">
					<Link href="/docs">View Docs</Link>
				</Button>
			</div>
		</section>
	);
}
