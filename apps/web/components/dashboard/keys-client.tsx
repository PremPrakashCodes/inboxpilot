"use client";

import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { type ApiKeyInfo, createKey, deleteKey, updateKey } from "@/lib/api";

function getToken(): string {
	const match = document.cookie.match(/inboxpilot_token=([^;]+)/);
	return match?.[1] ?? "";
}

const EXPIRY_OPTIONS = [
	{ label: "1 day", value: "1d" },
	{ label: "7 days", value: "7d" },
	{ label: "1 month", value: "1m" },
	{ label: "Never", value: "never" },
];

function isExpired(expiresAt: string): boolean {
	if (!expiresAt || expiresAt === "never") return false;
	return new Date(expiresAt) < new Date();
}

function CreateKeyDialog({ onCreated }: { onCreated: () => void }) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [expiresIn, setExpiresIn] = useState("7d");
	const [loading, setLoading] = useState(false);

	async function handleCreate() {
		if (!name.trim()) {
			toast.error("Name is required");
			return;
		}
		setLoading(true);
		try {
			const res = await createKey(getToken(), name.trim(), expiresIn);
			if (res.ok) {
				toast.success("API key created and sent to your email");
				setOpen(false);
				setName("");
				setExpiresIn("7d");
				onCreated();
			} else {
				toast.error(
					(res.data as { error?: string }).error ?? "Failed to create key",
				);
			}
		} catch {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Create Key
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create API Key</DialogTitle>
					<DialogDescription>
						The key will be sent to your registered email
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="key-name">Name</Label>
						<Input
							id="key-name"
							placeholder="e.g. Production"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="key-expiry">Expires</Label>
						<select
							id="key-expiry"
							value={expiresIn}
							onChange={(e) => setExpiresIn(e.target.value)}
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							{EXPIRY_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={loading}>
						{loading ? "Creating..." : "Create"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function EditKeyDialog({
	keyInfo,
	onUpdated,
}: {
	keyInfo: ApiKeyInfo;
	onUpdated: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState(keyInfo.name);
	const [expiresIn, setExpiresIn] = useState("7d");
	const [loading, setLoading] = useState(false);

	async function handleUpdate() {
		if (!name.trim()) {
			toast.error("Name is required");
			return;
		}
		setLoading(true);
		try {
			const res = await updateKey(getToken(), keyInfo.keyId, {
				name: name.trim(),
				expiresIn,
			});
			if (res.ok) {
				toast.success("API key updated");
				setOpen(false);
				onUpdated();
			} else {
				toast.error(
					(res.data as { error?: string }).error ?? "Failed to update key",
				);
			}
		} catch {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
					<Pencil className="mr-2 h-4 w-4" />
					Edit
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit API Key</DialogTitle>
					<DialogDescription>Update key name or expiry</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="edit-key-name">Name</Label>
						<Input
							id="edit-key-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-key-expiry">New Expiry</Label>
						<select
							id="edit-key-expiry"
							value={expiresIn}
							onChange={(e) => setExpiresIn(e.target.value)}
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							{EXPIRY_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button onClick={handleUpdate} disabled={loading}>
						{loading ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function DeleteKeyDialog({
	keyInfo,
	onDeleted,
}: {
	keyInfo: ApiKeyInfo;
	onDeleted: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	async function handleDelete() {
		setLoading(true);
		try {
			const res = await deleteKey(getToken(), keyInfo.keyId);
			if (res.ok) {
				toast.success("API key deleted");
				setOpen(false);
				onDeleted();
			} else {
				toast.error(
					(res.data as { error?: string }).error ?? "Failed to delete key",
				);
			}
		} catch {
			toast.error("Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem
					onSelect={(e) => e.preventDefault()}
					className="text-destructive"
				>
					<Trash2 className="mr-2 h-4 w-4" />
					Delete
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete API Key</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete &quot;{keyInfo.name}&quot;? This
						action cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={loading}
					>
						{loading ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export function KeysClient({ initialKeys }: { initialKeys: ApiKeyInfo[] }) {
	const router = useRouter();

	function refresh() {
		router.refresh();
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<CreateKeyDialog onCreated={refresh} />
			</div>

			{initialKeys.length > 0 && (
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Key</TableHead>
								<TableHead>Created</TableHead>
								<TableHead>Expires</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{initialKeys.map((key) => (
								<TableRow key={key.keyId}>
									<TableCell className="font-medium">{key.name}</TableCell>
									<TableCell>
										<code className="text-xs text-muted-foreground">
											{key.prefix}
										</code>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{new Date(key.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{key.expiresAt === "never"
											? "Never"
											: new Date(key.expiresAt).toLocaleDateString()}
									</TableCell>
									<TableCell>
										{isExpired(key.expiresAt) ? (
											<Badge variant="destructive">Expired</Badge>
										) : (
											<Badge variant="secondary">Active</Badge>
										)}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon" className="h-8 w-8">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<EditKeyDialog keyInfo={key} onUpdated={refresh} />
												<DeleteKeyDialog keyInfo={key} onDeleted={refresh} />
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
