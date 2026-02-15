import { Mail } from "lucide-react";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
	searchParams,
}: {
	searchParams: Promise<{ verify?: string }>;
}) {
	const { verify } = await searchParams;

	if (verify) {
		return (
			<div className="flex min-h-svh items-center justify-center px-4">
				<Card className="w-full max-w-sm">
					<CardHeader className="text-center">
						<Mail className="mx-auto mb-2 size-8 text-muted-foreground" />
						<CardTitle>Check your email</CardTitle>
						<CardDescription>
							We sent you a magic link. Click the link in your email to sign in.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-svh items-center justify-center px-4">
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Sign in to InboxPilot</CardTitle>
					<CardDescription>
						Enter your email to receive a magic link
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						action={async (formData) => {
							"use server";
							await signIn("resend", formData);
						}}
					>
						<div className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="you@example.com"
									required
								/>
							</div>
							<Button type="submit" className="w-full">
								<Mail className="size-4" />
								Send magic link
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
