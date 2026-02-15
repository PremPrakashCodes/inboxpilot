#!/usr/bin/env node
import * as path from "node:path";
import * as cdk from "aws-cdk-lib/core";
import * as dotenv from "dotenv";
import { InfraStack } from "../lib/infra-stack";

// Load .env from project root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const app = new cdk.App();
new InfraStack(app, "InfraStack", {
	synthesizer: new cdk.DefaultStackSynthesizer({
		fileAssetsBucketName:
			process.env.LAMBDA_BUCKET || "lambda-dependencies-store",
		generateBootstrapVersionRule: false,
	}),
});
