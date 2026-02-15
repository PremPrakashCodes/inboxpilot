import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import type { Construct } from "constructs";
import { createBackendApi } from "./constructs/api";
import { createLambdas } from "./constructs/lambdas";
import { createTables } from "./constructs/tables";

export class InfraStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		if (!process.env.INBOXPILOT_DOMAIN) {
			throw new Error(
				"INBOXPILOT_DOMAIN is required. Set it in .env or as an environment variable.",
			);
		}
		const API_DOMAIN = `api.${process.env.INBOXPILOT_DOMAIN}`;

		const apiCertificate = new acm.Certificate(this, "InboxPilotApiCert", {
			domainName: API_DOMAIN,
			validation: acm.CertificateValidation.fromDns(),
		});

		const apiDomainName = new apigwv2.DomainName(this, "InboxPilotApiDomain", {
			domainName: API_DOMAIN,
			certificate: apiCertificate,
		});

		const tables = createTables(this);
		const lambdas = createLambdas(this, { domain: API_DOMAIN, tables });

		const backendApi = createBackendApi(this, { lambdas });

		new apigwv2.ApiMapping(this, "ApiDomainMapping", {
			api: backendApi.httpApi,
			domainName: apiDomainName,
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
