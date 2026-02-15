import { KeyRound, Mail, Shield, Zap } from "lucide-react";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const features = [
	{
		icon: Shield,
		title: "Passwordless Auth",
		description:
			"No passwords to remember. Register with email, login via OTP, and you're in.",
	},
	{
		icon: Mail,
		title: "Gmail Integration",
		description:
			"Connect Gmail accounts via OAuth 2.0. Read, send, and manage emails through the API.",
	},
	{
		icon: Zap,
		title: "API-First",
		description:
			"Every feature is an API call. Build automations, integrations, and workflows with ease.",
	},
	{
		icon: KeyRound,
		title: "API Key Management",
		description:
			"Create, rotate, and expire API keys with configurable lifetimes. Full control over access.",
	},
];

export function Features() {
	return (
		<section className="px-6 py-20">
			<div className="container mx-auto">
				<h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
					Built for developers
				</h2>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{features.map((feature) => (
						<Card key={feature.title} className="bg-card/50">
							<CardHeader>
								<feature.icon className="mb-2 h-8 w-8 text-primary" />
								<CardTitle className="text-lg">{feature.title}</CardTitle>
								<CardDescription>{feature.description}</CardDescription>
							</CardHeader>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
