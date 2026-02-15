import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import type { Construct } from "constructs";
import { createBackendApi, createFrontendGateway } from "./constructs/api";
import { createFrontend } from "./constructs/frontend";
import { createLambdas } from "./constructs/lambdas";
import { createTables } from "./constructs/tables";

const DOMAIN = process.env.INBOXPILOT_DOMAIN || "example.com";
const API_DOMAIN = `api.${DOMAIN}`;

export class InfraStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const certificate = new acm.Certificate(this, "InboxPilotCert", {
			domainName: DOMAIN,
			validation: acm.CertificateValidation.fromDns(),
		});

		const apiCertificate = new acm.Certificate(this, "InboxPilotApiCert", {
			domainName: API_DOMAIN,
			validation: acm.CertificateValidation.fromDns(),
		});

		// Domain names (created at stack level to preserve CloudFormation IDs)
		const frontendDomainName = new apigwv2.DomainName(
			this,
			"InboxPilotDomain",
			{ domainName: DOMAIN, certificate },
		);

		const apiDomainName = new apigwv2.DomainName(this, "InboxPilotApiDomain", {
			domainName: API_DOMAIN,
			certificate: apiCertificate,
		});

		const tables = createTables(this);
		const lambdas = createLambdas(this, { domain: API_DOMAIN, tables });
		const frontend = createFrontend(this, { domain: DOMAIN });

		// Frontend gateway — serves Next.js at DOMAIN
		createFrontendGateway(this, {
			domainName: frontendDomainName,
			frontend,
		});

		// Backend API — serves API routes at api.DOMAIN
		const backendApi = createBackendApi(this, { lambdas });

		// Map backend API to api. subdomain (reuses existing ApiDomainMapping logical ID)
		new apigwv2.ApiMapping(this, "ApiDomainMapping", {
			api: backendApi.httpApi,
			domainName: apiDomainName,
		});

		new cdk.CfnOutput(this, "ApiUrl", { value: `https://${DOMAIN}` });
		new cdk.CfnOutput(this, "ApiGatewayDomainTarget", {
			value: frontendDomainName.regionalDomainName,
			description: `CNAME target in Cloudflare for ${DOMAIN}`,
		});
		new cdk.CfnOutput(this, "ApiSubdomainUrl", {
			value: `https://${API_DOMAIN}`,
		});
		new cdk.CfnOutput(this, "ApiSubdomainTarget", {
			value: apiDomainName.regionalDomainName,
			description: `CNAME target in Cloudflare for ${API_DOMAIN}`,
		});
	}
}
