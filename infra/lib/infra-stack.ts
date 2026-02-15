import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import type { Construct } from "constructs";
import { createApi } from "./constructs/api";
import { createFrontend } from "./constructs/frontend";
import { createLambdas } from "./constructs/lambdas";
import { createTables } from "./constructs/tables";

const DOMAIN = process.env.INBOXPILOT_DOMAIN || "inboxpilot.premprakash.dev";
const API_DOMAIN = `api.${DOMAIN}`;

// CloudFront requires a certificate in us-east-1. Create it manually and set this env var.
const CLOUDFRONT_CERT_ARN = process.env.CLOUDFRONT_CERT_ARN || "";

export class InfraStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// API Gateway cert (ap-south-1) for api. subdomain
		const apiCertificate = new acm.Certificate(this, "InboxPilotApiCert", {
			domainName: API_DOMAIN,
			validation: acm.CertificateValidation.fromDns(),
		});

		const tables = createTables(this);
		const lambdas = createLambdas(this, { domain: API_DOMAIN, tables });
		const api = createApi(this, {
			domain: API_DOMAIN,
			certificate: apiCertificate,
			lambdas,
		});

		new cdk.CfnOutput(this, "ApiUrl", { value: `https://${API_DOMAIN}` });
		new cdk.CfnOutput(this, "ApiGatewayDomainTarget", {
			value: api.domainName.regionalDomainName,
			description: `CNAME target in Cloudflare for ${API_DOMAIN}`,
		});

		// Frontend (CloudFront + S3 + Lambda) — only if cert ARN is provided
		if (CLOUDFRONT_CERT_ARN) {
			const frontendCert = acm.Certificate.fromCertificateArn(
				this,
				"FrontendCert",
				CLOUDFRONT_CERT_ARN,
			);

			const frontend = createFrontend(this, {
				domain: DOMAIN,
				certificate: frontendCert,
			});

			new cdk.CfnOutput(this, "FrontendUrl", {
				value: `https://${DOMAIN}`,
			});
			new cdk.CfnOutput(this, "CloudFrontDomainTarget", {
				value: frontend.distribution.distributionDomainName,
				description: `CNAME target in Cloudflare for ${DOMAIN}`,
			});
		}
	}
}
