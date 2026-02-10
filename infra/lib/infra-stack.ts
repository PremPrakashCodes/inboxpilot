import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import type { Construct } from "constructs";
import { createApi } from "./constructs/api";
import { createLambdas } from "./constructs/lambdas";
import { createTables } from "./constructs/tables";

const DOMAIN = process.env.INBOXPILOT_DOMAIN || "inboxpilot.premprakash.dev";

export class InfraStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const certificate = new acm.Certificate(this, "InboxPilotCert", {
			domainName: DOMAIN,
			validation: acm.CertificateValidation.fromDns(),
		});

		const tables = createTables(this);
		const lambdas = createLambdas(this, { domain: DOMAIN, tables });
		const api = createApi(this, { domain: DOMAIN, certificate, lambdas });

		new cdk.CfnOutput(this, "ApiUrl", { value: `https://${DOMAIN}` });
		new cdk.CfnOutput(this, "ApiGatewayDomainTarget", {
			value: api.domainName.regionalDomainName,
			description: `Add this as CNAME target in Cloudflare for ${DOMAIN}`,
		});
		new cdk.CfnOutput(this, "CertificateArn", {
			value: certificate.certificateArn,
		});
	}
}
