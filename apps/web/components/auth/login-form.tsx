"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { login, verify } from "@/lib/api";

export function LoginForm() {
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [step, setStep] = useState<"email" | "otp">("email");
	const [loading, setLoading] = useState(false);

	async function handleSendOTP(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);

		const res = await login(email);
		setLoading(false);

		if (res.ok) {
			toast.success("OTP sent to your email");
			setStep("otp");
		} else {
			toast.error(
				(res.data as { error?: string }).error || "Failed to send OTP",
			);
		}
	}

	async function handleVerifyOTP(e: React.FormEvent) {
		e.preventDefault();
		if (otp.length !== 6) return;
		setLoading(true);

		const res = await verify(email, otp);
		setLoading(false);

		if (res.ok) {
			toast.success("API key sent to your email!");
		} else {
			toast.error(
				(res.data as { error?: string }).error || "Verification failed",
			);
			setOtp("");
		}
	}

	if (step === "otp") {
		return (
			<form onSubmit={handleVerifyOTP} className="grid gap-4">
				<p className="text-sm text-muted-foreground">
					Enter the 6-digit code sent to <strong>{email}</strong>
				</p>
				<div className="flex justify-center">
					<InputOTP maxLength={6} value={otp} onChange={setOtp}>
						<InputOTPGroup>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
							<InputOTPSlot index={3} />
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
						</InputOTPGroup>
					</InputOTP>
				</div>
				<Button
					type="submit"
					className="w-full"
					disabled={loading || otp.length !== 6}
				>
					{loading ? "Verifying..." : "Verify OTP"}
				</Button>
				<Button
					type="button"
					variant="ghost"
					className="w-full"
					onClick={() => {
						setStep("email");
						setOtp("");
					}}
				>
					Back to email
				</Button>
			</form>
		);
	}

	return (
		<form onSubmit={handleSendOTP} className="grid gap-4">
			<div className="grid gap-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					type="email"
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>
			<Button type="submit" className="w-full" disabled={loading}>
				{loading ? "Sending OTP..." : "Send OTP"}
			</Button>
		</form>
	);
}
