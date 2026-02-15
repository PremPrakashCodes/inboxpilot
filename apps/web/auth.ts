import { DynamoDBAdapter } from "@auth/dynamodb-adapter";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

const client = DynamoDBDocument.from(new DynamoDB({}), {
	marshallOptions: {
		convertEmptyValues: true,
		removeUndefinedValues: true,
		convertClassInstanceToMap: true,
	},
});

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: DynamoDBAdapter(client, { tableName: "inboxpilot-auth" }),
	providers: [
		Google,
		Resend({
			from: process.env.EMAIL_FROM ?? "InboxPilot <onboarding@resend.dev>",
		}),
	],
	pages: {
		signIn: "/login",
		newUser: "/register",
		verifyRequest: "/login?verify=true",
	},
});
