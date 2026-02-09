#!/usr/bin/env node
import * as path from "path";
import * as dotenv from "dotenv";
import * as cdk from "aws-cdk-lib/core";
import { InfraStack } from "../lib/infra-stack";

// Load .env from project root
dotenv.config({ path: path.join(__dirname, "../../.env") });

const app = new cdk.App();
new InfraStack(app, "InfraStack");
